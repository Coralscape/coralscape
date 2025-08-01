import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { CanvasState } from "@shared/schema";
import { exportCanvasAsImage } from "@/lib/canvas-utils";

export function useCanvasExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
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
      
      setShowSuccessPopup(true);
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

  const closeSuccessPopup = useCallback(() => {
    setShowSuccessPopup(false);
  }, []);

  const showSuccessMessage = useCallback(() => {
    setShowSuccessPopup(true);
  }, []);

  return { exportCanvas, isExporting, showSuccessPopup, closeSuccessPopup, showSuccessMessage };
}

export function useCanvasState() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    baseImage: null,
    overlays: [],
    selectedOverlayId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
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
    setCanvasState(prev => ({ ...prev, baseImage: imageUrl, panX: 0, panY: 0 }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setCanvasState(prev => ({ ...prev, panX, panY }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setCanvasState(prev => ({ ...prev, zoom }));
  }, []);

  return {
    canvasState,
    updateOverlay,
    addOverlay,
    removeOverlay,
    selectOverlay,
    setBaseImage,
    setPan,
    setZoom,
  };
}
