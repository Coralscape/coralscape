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
import { CoralData, OverlayData, CanvasState } from "@shared/schema";
import { fetchWatermarkFromSheets } from "@/lib/google-sheets";

export default function AquariumDesigner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      toast({
        title: "Connected Successfully",
        description: `Loaded ${data.data?.length || 0} coral specimens from database.`,
      });
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Desktop layout */}
        <div className="hidden lg:flex lg:flex-col lg:h-screen">
          <TopNavigation
            onConnect={handleConnect}
            isConnecting={connectSheetsMutation.isPending}
            isConnected={isConnected}
          />
          <div className="flex-1 flex overflow-hidden">
            <div className="block">
              <OverlaySidebar
                coralData={coralData}
                isLoading={isLoadingCorals}
                onAddOverlay={handleAddOverlay}
              />
            </div>
            
            <div className="flex-1 min-w-0">
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
            
            <div className="block">
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
        </div>

        {/* Mobile/Tablet layout */}
        <div className="lg:hidden flex flex-col h-screen">
          {/* Logo bar with buy me a frag button - 5% */}
          <div className="h-[5vh] min-h-[40px]">
            <TopNavigation
              onConnect={handleConnect}
              isConnecting={connectSheetsMutation.isPending}
              isConnected={isConnected}
            />
          </div>
          
          {/* Corals & Inverts section - 35% (increased from 30% since no export section) */}
          <div className="h-[35vh] border-b border-border">
            <OverlaySidebar
              coralData={coralData}
              isLoading={isLoadingCorals}
              onAddOverlay={handleAddOverlay}
              hideSearchBar={true}
            />
          </div>
          
          {/* Tank workspace - 60% */}
          <div className="h-[60vh] flex-1">
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
        </div>
      </div>
    </DndProvider>
  );
}
