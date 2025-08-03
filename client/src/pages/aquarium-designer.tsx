import { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TopNavigation from "@/components/top-navigation";
import OverlaySidebar from "@/components/overlay-sidebar";
import CanvasWorkspace from "@/components/canvas-workspace";
import LayerControls from "@/components/layer-controls";
import { Button } from "@/components/ui/button";
import { Loader2, Plug, CheckCircle2, Download, Camera, Save } from "lucide-react";
import { CoralData, OverlayData, CanvasState } from "@shared/schema";
import { fetchWatermarkFromSheets } from "@/lib/google-sheets";
import { useCanvasExport } from "@/hooks/use-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveToPhotos } from "@/lib/canvas-utils";
import ExportSuccessPopup from "@/components/export-success-popup";

export default function AquariumDesigner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { exportCanvas, isExporting, showSuccessPopup, closeSuccessPopup, showSuccessMessage } = useCanvasExport();
  const [showMobileExportDialog, setShowMobileExportDialog] = useState(false);
  const [isSavingToPhotos, setIsSavingToPhotos] = useState(false);

  const handleMobileSaveToPhotos = async () => {
    setIsSavingToPhotos(true);
    try {
      // Auto-zoom to 100% and center before export if not already at 100%
      if (canvasState.zoom !== 1) {
        handleZoomChange(1);
        handlePanChange(0, 0); // Reset pan position to center
        // Small delay to let the zoom change take effect
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await saveToPhotos(canvasState);
      setShowMobileExportDialog(false);
      // Show success popup with "Buy me a frag" button instead of toast
      setTimeout(() => {
        showSuccessMessage();
      }, 100); // Small delay to ensure dialog closes first
    } catch (error) {
      console.error('Save to photos error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save to photos. Try downloading instead.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToPhotos(false);
    }
  };

  const handleMobileDownload = async () => {
    try {
      // Auto-zoom to 100% and center before export if not already at 100%
      if (canvasState.zoom !== 1) {
        handleZoomChange(1);
        handlePanChange(0, 0); // Reset pan position to center
        // Small delay to let the zoom change take effect
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await exportCanvas(canvasState);
      setShowMobileExportDialog(false);
    } catch (error) {
      console.error('Download error:', error);
    }
  };
  
  const handleMobileExportClick = async () => {
    // Auto-zoom to 100% and center before opening export dialog
    if (canvasState.zoom !== 1) {
      handleZoomChange(1);
      handlePanChange(0, 0); // Reset pan position to center
      // Small delay to let the zoom change take effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setShowMobileExportDialog(true);
  };
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    baseImage: null,
    overlays: [],
    selectedOverlayId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  // Undo functionality
  // Simple undo system that tracks individual actions
  const [undoStack, setUndoStack] = useState<{type: string, data: any}[]>([]);
  const [canUndoAction, setCanUndoAction] = useState(false);
  
  // Track drag operations to avoid saving multiple undo states during dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartState, setDragStartState] = useState<OverlayData | null>(null);

  const fixedSheetsUrl = "https://docs.google.com/spreadsheets/d/1j4ZgG9NFOfB_H4ExYY8mKzUQuflXmRa6pP8fsdDxt-4/edit?usp=sharing";
  const [isConnected, setIsConnected] = useState(false);

  // Fetch coral data
  const { data: coralData = [], isLoading: isLoadingCorals } = useQuery<CoralData[]>({
    queryKey: ["/api/corals"],
    enabled: isConnected,
  });

  // Auto-load database on component mount
  useEffect(() => {
    if (!isConnected) {
      connectSheetsMutation.mutate();
    }
  }, []);

  // Connect to Google Sheets mutation
  const connectSheetsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sheets/connect", { sheetsUrl: fixedSheetsUrl });
      return response.json();
    },
    onSuccess: (data) => {
      setIsConnected(true);
      queryClient.invalidateQueries({ queryKey: ["/api/corals"] });
      
      // Check if on mobile device
      const isMobile = window.innerWidth < 1024;
      
      const toastInstance = toast({
        title: "Connected Successfully",
        description: `Loaded ${data.data?.length || 0} coral specimens from database.`,
        duration: isMobile ? 1000 : 5000, // 1 second on mobile, 5 seconds on desktop
      });
      
      // Auto-dismiss after the specified duration on mobile
      if (isMobile) {
        setTimeout(() => {
          toastInstance.dismiss();
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to coral database",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    connectSheetsMutation.mutate();
  };

  // Save specific action to undo stack
  const saveActionToUndo = useCallback((action: {type: string, data: any}) => {
    setUndoStack(prev => {
      // Don't add duplicate actions
      const lastAction = prev[prev.length - 1];
      if (lastAction && 
          lastAction.type === action.type && 
          JSON.stringify(lastAction.data) === JSON.stringify(action.data)) {
        return prev;
      }
      // Keep last 20 actions
      const newStack = [...prev.slice(-19), action];
      return newStack;
    });
    setCanUndoAction(true);
  }, []);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const lastAction = undoStack[undoStack.length - 1];
      console.log('Undoing action:', lastAction.type, lastAction.data);
      
      // Reverse the action based on its type
      switch (lastAction.type) {
        case 'ADD_OVERLAY':
          setCanvasState(prev => {
            const newOverlays = prev.overlays.filter(overlay => overlay.id !== lastAction.data.id);
            return {
              ...prev,
              overlays: newOverlays,
              selectedOverlayId: null,
            };
          });
          break;
          
        case 'DELETE_OVERLAY':
          setCanvasState(prev => {
            // Make sure the overlay doesn't already exist
            const exists = prev.overlays.find(o => o.id === lastAction.data.overlay.id);
            if (!exists) {
              return {
                ...prev,
                overlays: [...prev.overlays, lastAction.data.overlay],
                selectedOverlayId: lastAction.data.overlay.id,
              };
            }
            return prev;
          });
          break;
          
        case 'UPDATE_OVERLAY':
          setCanvasState(prev => ({
            ...prev,
            overlays: prev.overlays.map(overlay =>
              overlay.id === lastAction.data.id ? { ...lastAction.data.previousState } : overlay
            ),
          }));
          break;
      }
      
      setUndoStack(prev => prev.slice(0, -1));
      setCanUndoAction(undoStack.length > 1);
    }
  }, [undoStack]);

  // Delete overlay function (defined before useEffect that references it)
  const handleDeleteOverlay = (overlayId: string) => {
    const overlayToDelete = canvasState.overlays.find(overlay => overlay.id === overlayId);
    if (overlayToDelete) {
      console.log('Saving delete action for overlay:', overlayId, overlayToDelete);
      saveActionToUndo({
        type: 'DELETE_OVERLAY',
        data: { overlay: overlayToDelete }
      });
      
      setCanvasState(prev => ({
        ...prev,
        overlays: prev.overlays.filter(overlay => overlay.id !== overlayId),
        selectedOverlayId: prev.selectedOverlayId === overlayId ? null : prev.selectedOverlayId,
      }));
    }
  };

  // Keyboard event handler with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as Element;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).contentEditable === 'true')) {
        return;
      }
      
      // Delete key to delete selected overlay
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvasState.selectedOverlayId) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteOverlay(canvasState.selectedOverlayId);
        return;
      }
      
      // Ctrl+Z or Cmd+Z for undo (support both Windows/Linux and Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey && canUndoAction) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
        return;
      }
    };

    // Add event listener with capture to catch events early
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [canvasState.selectedOverlayId, canUndoAction, handleUndo, handleDeleteOverlay]);

  // Note: Mouse up handling is now done in the canvas workspace component directly

  const handleAddOverlay = (coral: CoralData, position: { x: number; y: number }) => {
    
    // Calculate proportional size while limiting maximum size
    const maxSize = 150;
    const aspectRatio = coral.width / coral.height;
    let newWidth = coral.width;
    let newHeight = coral.height;
    
    if (newWidth > maxSize || newHeight > maxSize) {
      if (aspectRatio > 1) {
        // Wider than tall
        newWidth = maxSize;
        newHeight = maxSize / aspectRatio;
      } else {
        // Taller than wide
        newHeight = maxSize;
        newWidth = maxSize * aspectRatio;
      }
    }

    const newOverlay: OverlayData = {
      id: `overlay-${Date.now()}`,
      coralId: coral.id,
      name: coral.name,
      imageUrl: coral.fullImageUrl,
      x: position.x,
      y: position.y,
      width: newWidth,
      height: newHeight,
      opacity: 1,
      layer: canvasState.overlays.length,
      rotation: 0,
      flipH: false,
      flipV: false,
    };

    setCanvasState(prev => ({
      ...prev,
      overlays: [...prev.overlays, newOverlay],
      selectedOverlayId: newOverlay.id,
    }));
    
    // Save the add action for undo
    console.log('Saving add action for overlay:', newOverlay.id);
    saveActionToUndo({
      type: 'ADD_OVERLAY',
      data: { id: newOverlay.id }
    });
  };

  // Add a prop to track when dragging starts and ends from canvas component
  const handleDragStart = (overlayId: string) => {
    const currentOverlay = canvasState.overlays.find(overlay => overlay.id === overlayId);
    if (currentOverlay && !isDragging) {
      console.log('Drag started for overlay:', overlayId);
      setIsDragging(true);
      setDragStartState({ ...currentOverlay });
    }
  };

  const handleDragEnd = () => {
    if (isDragging && dragStartState) {
      console.log('Drag ended - saving action');
      saveActionToUndo({
        type: 'UPDATE_OVERLAY',
        data: { 
          id: dragStartState.id, 
          previousState: dragStartState 
        }
      });
      setIsDragging(false);
      setDragStartState(null);
    }
  };

  const handleUpdateOverlay = (overlayId: string, updates: Partial<OverlayData>) => {
    // Check if this is an instant transformation (rotation, flip, resize)
    const isInstantTransform = updates.hasOwnProperty('rotation') || 
                              updates.hasOwnProperty('flipH') || 
                              updates.hasOwnProperty('flipV') ||
                              updates.hasOwnProperty('width') ||
                              updates.hasOwnProperty('height');
    
    // For instant transformations, always save undo
    if (isInstantTransform) {
      const currentOverlay = canvasState.overlays.find(overlay => overlay.id === overlayId);
      if (currentOverlay) {
        console.log('Saving instant transform action for overlay:', overlayId, 'updates:', Object.keys(updates));
        saveActionToUndo({
          type: 'UPDATE_OVERLAY',
          data: { 
            id: overlayId, 
            previousState: { ...currentOverlay } 
          }
        });
      }
    }
    
    setCanvasState(prev => ({
      ...prev,
      overlays: prev.overlays.map(overlay =>
        overlay.id === overlayId ? { ...overlay, ...updates } : overlay
      ),
    }));
  };

  const handleZoomChange = (newZoom: number) => {
    setCanvasState(prev => {
      // If zooming back to 100% or less, reset pan to center
      const shouldCenter = newZoom <= 1 && prev.zoom > 1;
      return {
        ...prev,
        zoom: newZoom,
        panX: shouldCenter ? 0 : prev.panX,
        panY: shouldCenter ? 0 : prev.panY,
      };
    });
  };

  const handlePanChange = (panX: number, panY: number) => {
    setCanvasState(prev => ({ ...prev, panX, panY }));
  };

  const handleSelectOverlay = (overlayId: string | null) => {
    setCanvasState(prev => ({ ...prev, selectedOverlayId: overlayId }));
  };

  const handleBaseImageUpload = async (imageUrl: string) => {
    setCanvasState(prev => ({ ...prev, baseImage: imageUrl, panX: 0, panY: 0 }));
    
    // Fetch watermark from Google Sheets when base image is uploaded
    try {
      const watermarkText = await fetchWatermarkFromSheets(fixedSheetsUrl);
      if (watermarkText) {
        console.log('Watermark loaded:', watermarkText);
        // Store watermark in canvas state or global state if needed
      }
    } catch (error) {
      console.warn('Failed to load watermark:', error);
    }
  };

  const selectedOverlay = canvasState.overlays.find(o => o.id === canvasState.selectedOverlayId);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background">
        {/* Desktop: Full TopNavigation */}
        <div className="hidden lg:block">
          <TopNavigation
            onConnect={handleConnect}
            isConnecting={connectSheetsMutation.isPending}
            isConnected={isConnected}
          />
        </div>
        
        {/* Mobile/Tablet: Compact header with logo and buy me a frag */}
        <div className="lg:hidden bg-background border-b border-border px-2 py-2 shadow-sm h-[7.5vh] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="https://i.ibb.co/KcqLs8LM/Screen-Shot-2025-07-27-at-8-11-42-PM.png"
              alt="CoralScape"
              className="h-8 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<h1 class="text-lg font-bold text-gray-900">CoralScape</h1>';
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-900/30 px-2 py-1 text-xs"
              onClick={() => window.open('https://buymeacoffee.com/coralscape', '_blank')}
            >
              <span className="mr-1">🪸</span>
              <span>Buy me a frag</span>
            </Button>
          </div>
          
          <Button
            onClick={handleMobileExportClick}
            disabled={isExporting || !canvasState.baseImage}
            size="sm"
            className="whitespace-nowrap text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400"
          >
            <Download className="mr-1 h-3 w-3" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
        
        {/* Mobile scroll indicator */}
        <div 
          className="mobile-scroll-indicator lg:hidden"
          onTouchStart={(e) => {
            e.preventDefault();
            const startY = e.touches[0].clientY;
            const startScrollTop = window.pageYOffset;
            
            const handleTouchMove = (moveEvent: TouchEvent) => {
              moveEvent.preventDefault();
              const currentY = moveEvent.touches[0].clientY;
              const deltaY = (currentY - startY) * 2; // Amplify scroll sensitivity
              window.scrollTo(0, startScrollTop - deltaY);
            };
            
            const handleTouchEnd = () => {
              document.removeEventListener('touchmove', handleTouchMove);
              document.removeEventListener('touchend', handleTouchEnd);
            };
            
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
          }}
        ></div>
        
        <div className="flex flex-col lg:flex-row h-[calc(100vh-15vh)] lg:h-[calc(100vh-80px)]">
          {/* Mobile/Tablet: Compact sidebar with specific height allocation */}
          <div className="lg:hidden h-[53.5vh] overflow-y-auto border-b border-border">
            <OverlaySidebar
              coralData={coralData}
              isLoading={isLoadingCorals}
              onAddOverlay={handleAddOverlay}
              isMobileCompact={true}
            />
          </div>

          {/* Desktop: Show sidebar on left */}
          <div className="hidden lg:block">
            <OverlaySidebar
              coralData={coralData}
              isLoading={isLoadingCorals}
              onAddOverlay={handleAddOverlay}
              isMobileCompact={false}
            />
          </div>
          
          {/* Canvas workspace - takes remaining space */}
          <div className="flex-1 min-w-0 h-[31.5vh] lg:h-full">
            <CanvasWorkspace
              canvasState={canvasState}
              onUpdateOverlay={handleUpdateOverlay}
              onSelectOverlay={handleSelectOverlay}
              onBaseImageUpload={handleBaseImageUpload}
              onAddOverlay={handleAddOverlay}
              onZoomChange={handleZoomChange}
              onPanChange={handlePanChange}
              onDeleteOverlay={handleDeleteOverlay}
              onUndo={handleUndo}
              canUndo={canUndoAction}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
          
          {/* Layer controls - hidden on mobile/tablet, visible on large screens */}
          <div className="hidden lg:block">
            <LayerControls
              canvasState={canvasState}
              selectedOverlay={selectedOverlay}
              onUpdateOverlay={handleUpdateOverlay}
              onDeleteOverlay={handleDeleteOverlay}
              onSelectOverlay={handleSelectOverlay}
              onZoomChange={handleZoomChange}
              onPanChange={handlePanChange}
            />
          </div>
        </div>

        {/* Mobile Export Dialog */}
        <Dialog open={showMobileExportDialog} onOpenChange={setShowMobileExportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Your Tank Design</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleMobileSaveToPhotos}
                disabled={isSavingToPhotos}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="mr-2 h-4 w-4" />
                {isSavingToPhotos ? 'Saving to Photos...' : 'Save to Camera Roll'}
              </Button>
              
              <Button
                onClick={handleMobileDownload}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Downloading...' : 'Download to Device'}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Choose how you'd like to save your aquarium design
              </p>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Export Success Popup - shows "Buy me a frag" button */}
        <ExportSuccessPopup 
          isOpen={showSuccessPopup}
          onClose={closeSuccessPopup}
        />
      </div>
    </DndProvider>
  );
}
