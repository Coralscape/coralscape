import React, { useRef, useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";
import { CanvasState, OverlayData, CoralData } from "@shared/schema";

interface CanvasWorkspaceProps {
  canvasState: CanvasState;
  onUpdateOverlay: (overlayId: string, updates: Partial<OverlayData>) => void;
  onSelectOverlay: (overlayId: string | null) => void;
  onBaseImageUpload: (imageUrl: string) => void;
  onAddOverlay: (coral: CoralData, position: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
}

interface DraggableOverlayProps {
  overlay: OverlayData;
  isSelected: boolean;
  onUpdate: (updates: Partial<OverlayData>) => void;
  onSelect: () => void;
}

interface TransformControls {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

function DraggableOverlay({ overlay, isSelected, onUpdate, onSelect }: DraggableOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('overlay-image')) {
      return; // Don't start drag if clicking on resize handle
    }
    
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - overlay.x, y: e.clientY - overlay.y });
  }, [overlay.x, overlay.y, onSelect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: overlay.width,
      height: overlay.height,
    });
  }, [overlay.width, overlay.height]);

  // Calculate aspect ratio for the overlay
  const aspectRatio = overlay.width / overlay.height;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onUpdate({
        x: Math.max(0, e.clientX - dragStart.x),
        y: Math.max(0, e.clientY - dragStart.y),
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      // Maintain aspect ratio when resizing
      const newWidth = Math.max(20, resizeStart.width + deltaX);
      const newHeight = newWidth / aspectRatio;
      
      onUpdate({
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`canvas-overlay ${isSelected ? 'selected' : ''}`}
      style={{
        left: overlay.x,
        top: overlay.y,
        width: overlay.width,
        height: overlay.height,
        opacity: overlay.opacity,
        zIndex: overlay.layer + 10,
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={overlay.imageUrl}
        alt={overlay.name}
        className="overlay-image w-full h-full object-cover rounded-lg border-2 border-transparent hover:border-primary transition-colors"
        style={{
          transform: `rotate(${overlay.rotation || 0}deg) scaleX(${overlay.flipH ? -1 : 1}) scaleY(${overlay.flipV ? -1 : 1})`
        }}
        draggable={false}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
        }}
      />
      
      {isSelected && (
        <>
          <div
            className="resize-handle nw"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="resize-handle ne"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="resize-handle sw"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="resize-handle se"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
          
          {/* Transform Controls */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div
                className="relative cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startRotation = overlay.rotation || 0;
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const centerX = rect.left + rect.width / 2;
                  const centerY = rect.top + rect.height / 2;
                  const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                  
                  let isDragging = true;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    if (!isDragging) return;
                    
                    const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                    const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
                    const newRotation = (startRotation + angleDiff) % 360;
                    
                    onUpdate({ rotation: newRotation < 0 ? newRotation + 360 : newRotation });
                  };
                  
                  const handleMouseUp = () => {
                    isDragging = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                onClick={() => onUpdate({ rotation: ((overlay.rotation || 0) + 10) % 360 })}
                title="Drag to rotate smoothly, click for 10°"
              >
                <div className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                  <RotateCw className="h-3 w-3" />
                </div>
              </div>
              <span className="text-xs text-gray-500 min-w-[35px]">
                {Math.round(overlay.rotation || 0)}°
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onUpdate({ 
                flipH: !(overlay.flipH || false)
              })}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onUpdate({ 
                flipV: !(overlay.flipV || false)
              })}
              title="Flip Vertical"
            >
              <FlipVertical className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function CanvasWorkspace({
  canvasState,
  onUpdateOverlay,
  onSelectOverlay,
  onBaseImageUpload,
  onAddOverlay,
  onZoomChange,
}: CanvasWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInput, setZoomInput] = useState(Math.round(canvasState.zoom * 100).toString());

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'coral',
    drop: (item: { coral: CoralData }, monitor) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const dropOffset = monitor.getClientOffset();
      
      if (canvasRect && dropOffset) {
        const x = dropOffset.x - canvasRect.left;
        const y = dropOffset.y - canvasRect.top;
        onAddOverlay(item.coral, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onBaseImageUpload(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectOverlay(null);
    }
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(canvasState.zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(canvasState.zoom / 1.2, 0.1));
  };

  const handleBaseImageClick = () => {
    // Select base image (deselect any overlays)
    onSelectOverlay(null);
  };

  const handleZoomInputChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 500) {
      onZoomChange(numValue / 100);
      setZoomInput(value);
    }
  };

  const handleZoomInputSubmit = () => {
    setIsEditingZoom(false);
    const numValue = parseInt(zoomInput);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 500) {
      onZoomChange(numValue / 100);
    } else {
      setZoomInput(Math.round(canvasState.zoom * 100).toString());
    }
  };



  return (
    <main className="flex-1 bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tank Workspace</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Zoom:</span>
              <Button variant="ghost" size="sm" className="p-1" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              {isEditingZoom ? (
                <Input
                  type="number"
                  value={zoomInput}
                  onChange={(e) => setZoomInput(e.target.value)}
                  onBlur={handleZoomInputSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleZoomInputSubmit();
                    } else if (e.key === 'Escape') {
                      setIsEditingZoom(false);
                      setZoomInput(Math.round(canvasState.zoom * 100).toString());
                    }
                  }}
                  className="w-16 h-6 text-xs text-center"
                  min="10"
                  max="500"
                  autoFocus
                />
              ) : (
                <span 
                  className="font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  onClick={() => setIsEditingZoom(true)}
                >
                  {Math.round(canvasState.zoom * 100)}%
                </span>
              )}
              <Button variant="ghost" size="sm" className="p-1" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="whitespace-nowrap"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Base Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div
            ref={(node) => {
              drop(node);
              if (canvasRef.current !== node) {
                (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              }
            }}
            className={`relative bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 min-h-[600px] flex items-center justify-center overflow-hidden ${
              isOver ? 'drop-zone-active' : ''
            }`}
            onClick={handleCanvasClick}
          >
            {canvasState.baseImage ? (
              <div className="relative w-full h-full">
                <img
                  src={canvasState.baseImage}
                  alt="Tank base"
                  className="w-full h-auto rounded-lg cursor-pointer"
                  style={{ transform: `scale(${canvasState.zoom})` }}
                  onClick={handleBaseImageClick}
                />
                
                {/* Render overlays */}
                {canvasState.overlays.map((overlay) => (
                  <DraggableOverlay
                    key={overlay.id}
                    overlay={overlay}
                    isSelected={overlay.id === canvasState.selectedOverlayId}
                    onUpdate={(updates) => onUpdateOverlay(overlay.id, updates)}
                    onSelect={() => onSelectOverlay(overlay.id)}
                  />
                ))}
                
                {/* Watermark */}
                {canvasState.baseImage && (
                  <div 
                    className="watermark absolute z-50 pointer-events-none"
                    style={{ 
                      width: `${20 * canvasState.zoom}%`,
                      bottom: `${20 * canvasState.zoom}px`,
                      right: `${20 * canvasState.zoom}px`,
                    }}
                  >
                    <img 
                      src="https://i.ibb.co/Z6g9TGRC/Screen-Shot-2024-03-05-at-1-43-18-AM.png"
                      alt="CoralScape"
                      className="w-full h-auto opacity-80"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-xs font-medium text-gray-600 px-2 py-1">CoralScape</div>';
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Tank Image</h3>
                <p className="text-gray-600 mb-6">Drop your aquarium image here or click to browse</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
