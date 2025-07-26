import { useState, useEffect } from "react";
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
  };

  const handleUpdateOverlay = (overlayId: string, updates: Partial<OverlayData>) => {
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

  const handleDeleteOverlay = (overlayId: string) => {
    setCanvasState(prev => ({
      ...prev,
      overlays: prev.overlays.filter(overlay => overlay.id !== overlayId),
      selectedOverlayId: prev.selectedOverlayId === overlayId ? null : prev.selectedOverlayId,
    }));
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
        <TopNavigation
          onConnect={handleConnect}
          isConnecting={connectSheetsMutation.isPending}
          isConnected={isConnected}
        />
        
        <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
          {/* Mobile: Show sidebar above canvas */}
          <div className="md:hidden max-h-48 overflow-y-auto">
            <OverlaySidebar
              coralData={coralData}
              isLoading={isLoadingCorals}
              onAddOverlay={handleAddOverlay}
            />
          </div>

          {/* Desktop: Show sidebar on left */}
          <div className="hidden md:block">
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
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
