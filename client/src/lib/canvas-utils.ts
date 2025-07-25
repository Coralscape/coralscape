import { CanvasState, OverlayData } from "@shared/schema";

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
        
        // Draw watermark
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
        
        // Calculate position and size relative to canvas
        const x = (overlay.x / 800) * canvasWidth; // Assuming workspace is 800px wide
        const y = (overlay.y / 600) * canvasHeight; // Assuming workspace is 600px tall
        const width = (overlay.width / 800) * canvasWidth;
        const height = (overlay.height / 600) * canvasHeight;
        
        ctx.drawImage(img, x, y, width, height);
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

function drawWatermark(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): Promise<void> {
  return new Promise((resolve) => {
    // Draw text watermark since we don't have the actual watermark image
    ctx.save();
    
    // Calculate watermark size (20% of canvas width)
    const watermarkWidth = canvasWidth * 0.2;
    const fontSize = Math.max(12, watermarkWidth / 8);
    
    // Position in bottom right
    const x = canvasWidth - watermarkWidth - 20;
    const y = canvasHeight - 40;
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x - 10, y - fontSize - 5, watermarkWidth + 20, fontSize + 15);
    
    // Draw text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CoralScape', x + watermarkWidth / 2, y);
    
    ctx.restore();
    resolve();
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
