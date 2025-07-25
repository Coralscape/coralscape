import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { CanvasState } from "@shared/schema";
import { exportCanvasAsImage } from "@/lib/canvas-utils";

export function useCanvasExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportCanvas = useCallback(async (canvasState: CanvasState) => {
    if (!canvasState.baseImage) {
      toast({
        title: "No Base Image",
        description: "Please upload a base tank image before exporting",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      await exportCanvasAsImage(canvasState);
      
      toast({
        title: "Export Successful",
        description: "Your tank design has been downloaded successfully!",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your tank design",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  return { exportCanvas, isExporting };
}

export function useCanvasState() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    baseImage: null,
    overlays: [],
    selectedOverlayId: null,
    zoom: 1,
  });

  const updateOverlay = useCallback((overlayId: string, updates: Partial<any>) => {
    setCanvasState(prev => ({
      ...prev,
      overlays: prev.overlays.map(overlay =>
        overlay.id === overlayId ? { ...overlay, ...updates } : overlay
      ),
    }));
  }, []);

  const addOverlay = useCallback((overlay: any) => {
    setCanvasState(prev => ({
      ...prev,
      overlays: [...prev.overlays, overlay],
      selectedOverlayId: overlay.id,
    }));
  }, []);

  const removeOverlay = useCallback((overlayId: string) => {
    setCanvasState(prev => ({
      ...prev,
      overlays: prev.overlays.filter(overlay => overlay.id !== overlayId),
      selectedOverlayId: prev.selectedOverlayId === overlayId ? null : prev.selectedOverlayId,
    }));
  }, []);

  const selectOverlay = useCallback((overlayId: string | null) => {
    setCanvasState(prev => ({ ...prev, selectedOverlayId: overlayId }));
  }, []);

  const setBaseImage = useCallback((imageUrl: string) => {
    setCanvasState(prev => ({ ...prev, baseImage: imageUrl }));
  }, []);

  return {
    canvasState,
    updateOverlay,
    addOverlay,
    removeOverlay,
    selectOverlay,
    setBaseImage,
  };
}
