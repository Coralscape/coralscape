import { CanvasState, OverlayData } from "@shared/schema";
import { fetchWatermarkFromSheets } from "./google-sheets";

export async function exportCanvasAsImage(canvasState: CanvasState): Promise<void> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !canvasState.baseImage) {
      reject(new Error('Canvas context or base image not available'));
      return;
    }

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    
    baseImg.onload = async () => {
      try {
        // Set canvas dimensions based on base image
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        
        // Draw base image
        ctx.drawImage(baseImg, 0, 0);
        
        // Draw overlays
        const overlayPromises = canvasState.overlays
          .sort((a, b) => a.layer - b.layer) // Draw in layer order
          .map(overlay => drawOverlay(ctx, overlay, canvas.width, canvas.height));
        
        await Promise.all(overlayPromises);
        
        // Draw watermark from Google Sheets
        await drawWatermark(ctx, canvas.width, canvas.height);
        
        // Export as blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `coralscape-design-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        reject(error);
      }
    };
    
    baseImg.onerror = () => {
      reject(new Error('Failed to load base image'));
    };
    
    baseImg.src = canvasState.baseImage;
  });
}

function drawOverlay(
  ctx: CanvasRenderingContext2D, 
  overlay: OverlayData, 
  canvasWidth: number, 
  canvasHeight: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        ctx.save();
        ctx.globalAlpha = overlay.opacity;
        
        // Get the actual base image dimensions from the DOM
        const baseImageElement = document.querySelector('.canvas-workspace img') as HTMLImageElement;
        const baseImageRect = baseImageElement?.getBoundingClientRect();
        const displayWidth = baseImageRect?.width || canvasWidth;
        const displayHeight = baseImageRect?.height || canvasHeight;
        
        // Calculate position and size relative to canvas using actual displayed image dimensions
        const x = (overlay.x / displayWidth) * canvasWidth;
        const y = (overlay.y / displayHeight) * canvasHeight;
        const width = (overlay.width / displayWidth) * canvasWidth;
        const height = (overlay.height / displayHeight) * canvasHeight;
        
        // Apply transforms if they exist
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        ctx.translate(centerX, centerY);
        
        // Apply rotation
        if (overlay.rotation) {
          ctx.rotate((overlay.rotation * Math.PI) / 180);
        }
        
        // Apply flips
        ctx.scale(overlay.flipH ? -1 : 1, overlay.flipV ? -1 : 1);
        
        // Draw the image centered
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        
        ctx.restore();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      console.warn(`Failed to load overlay image: ${overlay.imageUrl}`);
      resolve(); // Continue even if overlay fails
    };
    
    img.src = overlay.imageUrl;
  });
}

async function drawWatermark(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): Promise<void> {
  return new Promise(async (resolve) => {
    ctx.save();
    
    // Use the specific CoralScape watermark image
    const watermarkImageUrl = "https://i.ibb.co/Z6g9TGRC/Screen-Shot-2024-03-05-at-1-43-18-AM.png";
    
    // Calculate watermark size (20% of canvas width)
    const watermarkWidth = canvasWidth * 0.2;
    
    // Position in bottom right
    const x = canvasWidth - watermarkWidth - 20;
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Calculate proportional height
        const aspectRatio = img.width / img.height;
        const watermarkHeight = watermarkWidth / aspectRatio;
        const y = canvasHeight - watermarkHeight - 20;
        
        // Draw watermark image without background
        ctx.globalAlpha = 0.8;
        ctx.drawImage(img, x, y, watermarkWidth, watermarkHeight);
        ctx.globalAlpha = 1;
        
        ctx.restore();
        resolve();
      };
      
      img.onerror = () => {
        // Fall back to text if image fails
        drawTextWatermark();
      };
      
      img.src = watermarkImageUrl;
    } catch (error) {
      drawTextWatermark();
    }
    
    function drawTextWatermark() {
      const fontSize = Math.max(14, watermarkWidth / 8);
      const textY = canvasHeight - 40;
      
      // Draw text without background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('CoralScape', x + watermarkWidth / 2, textY);
      
      ctx.restore();
      resolve();
    }
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
