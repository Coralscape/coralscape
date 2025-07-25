import { useState } from "react";
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

export default function AquariumDesigner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    baseImage: null,
    overlays: [],
    selectedOverlayId: null,
    zoom: 1,
  });

  const fixedSheetsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJwB7OdxotJFCbibmsh5cbGmb0SNwrP_5YUSOCPFwZ_JMIDrNNBmvxxqbDowsva1kR4_XSkN4ZnyMm/pubhtml";
  const [isConnected, setIsConnected] = useState(false);

  // Fetch coral data
  const { data: coralData = [], isLoading: isLoadingCorals } = useQuery<CoralData[]>({
    queryKey: ["/api/corals"],
    enabled: isConnected,
  });

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
    const newOverlay: OverlayData = {
      id: `overlay-${Date.now()}`,
      coralId: coral.id,
      name: coral.name,
      imageUrl: coral.fullImageUrl,
      x: position.x,
      y: position.y,
      width: Math.min(coral.width, 150), // Limit initial size
      height: Math.min(coral.height, 150),
      opacity: 1,
      layer: canvasState.overlays.length,
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

  const handleBaseImageUpload = (imageUrl: string) => {
    setCanvasState(prev => ({ ...prev, baseImage: imageUrl }));
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
        
        <div className="flex h-[calc(100vh-80px)]">
          <OverlaySidebar
            coralData={coralData}
            isLoading={isLoadingCorals}
            onAddOverlay={handleAddOverlay}
          />
          
          <CanvasWorkspace
            canvasState={canvasState}
            onUpdateOverlay={handleUpdateOverlay}
            onSelectOverlay={handleSelectOverlay}
            onBaseImageUpload={handleBaseImageUpload}
            onAddOverlay={handleAddOverlay}
          />
          
          <LayerControls
            canvasState={canvasState}
            selectedOverlay={selectedOverlay}
            onUpdateOverlay={handleUpdateOverlay}
            onDeleteOverlay={handleDeleteOverlay}
            onSelectOverlay={handleSelectOverlay}
          />
        </div>
      </div>
    </DndProvider>
  );
}
