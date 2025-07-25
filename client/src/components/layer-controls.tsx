import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MousePointer, ArrowUp, ArrowDown, Trash2, Download, Layers, Eye, Image, Lock } from "lucide-react";
import { CanvasState, OverlayData } from "@shared/schema";
import { useCanvasExport } from "@/hooks/use-canvas";

interface LayerControlsProps {
  canvasState: CanvasState;
  selectedOverlay: OverlayData | undefined;
  onUpdateOverlay: (overlayId: string, updates: Partial<OverlayData>) => void;
  onDeleteOverlay: (overlayId: string) => void;
  onSelectOverlay: (overlayId: string | null) => void;
}

export default function LayerControls({
  canvasState,
  selectedOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  onSelectOverlay,
}: LayerControlsProps) {
  const { exportCanvas, isExporting } = useCanvasExport();

  const handleMoveLayer = (overlayId: string, direction: 'up' | 'down') => {
    const overlay = canvasState.overlays.find(o => o.id === overlayId);
    if (!overlay) return;

    const newLayer = direction === 'up' ? overlay.layer + 1 : overlay.layer - 1;
    const maxLayer = Math.max(...canvasState.overlays.map(o => o.layer));
    
    if (newLayer >= 0 && newLayer <= maxLayer) {
      onUpdateOverlay(overlayId, { layer: newLayer });
    }
  };

  const handleExport = async () => {
    try {
      await exportCanvas(canvasState);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const sortedOverlays = [...canvasState.overlays].sort((a, b) => b.layer - a.layer);

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Layer Controls</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4 space-y-6">
        {selectedOverlay && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <MousePointer className="text-primary mr-2 h-4 w-4" />
              Selected: <span className="ml-1">{selectedOverlay.name}</span>
            </h3>
            
            <div className="space-y-4">
              {/* Position Controls */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">X</Label>
                    <Input
                      type="number"
                      value={selectedOverlay.x}
                      onChange={(e) => onUpdateOverlay(selectedOverlay.id, { x: parseInt(e.target.value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Y</Label>
                    <Input
                      type="number"
                      value={selectedOverlay.y}
                      onChange={(e) => onUpdateOverlay(selectedOverlay.id, { y: parseInt(e.target.value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Size Controls */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Width</Label>
                    <Input
                      type="number"
                      value={selectedOverlay.width}
                      onChange={(e) => onUpdateOverlay(selectedOverlay.id, { width: parseInt(e.target.value) || 1 })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Height</Label>
                    <Input
                      type="number"
                      value={selectedOverlay.height}
                      onChange={(e) => onUpdateOverlay(selectedOverlay.id, { height: parseInt(e.target.value) || 1 })}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <Checkbox id="maintain-ratio" defaultChecked />
                  <Label htmlFor="maintain-ratio" className="ml-2 text-sm text-gray-600">
                    Maintain aspect ratio
                  </Label>
                </div>
              </div>

              {/* Opacity Control */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Opacity</Label>
                <Slider
                  value={[selectedOverlay.opacity * 100]}
                  onValueChange={(value) => onUpdateOverlay(selectedOverlay.id, { opacity: value[0] / 100 })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{Math.round(selectedOverlay.opacity * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Layer Order Controls */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Layer Order</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleMoveLayer(selectedOverlay.id, 'up')}
                  >
                    <ArrowUp className="mr-1 h-3 w-3" />
                    Forward
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleMoveLayer(selectedOverlay.id, 'down')}
                  >
                    <ArrowDown className="mr-1 h-3 w-3" />
                    Backward
                  </Button>
                </div>
              </div>

              {/* Delete Control */}
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => onDeleteOverlay(selectedOverlay.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Remove Layer
              </Button>
            </div>
          </div>
        )}

        {/* Layer List */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
            <span>
              <Layers className="text-accent mr-2 h-4 w-4 inline" />
              All Layers
            </span>
            <Badge variant="secondary">{canvasState.overlays.length + (canvasState.baseImage ? 1 : 0)} layers</Badge>
          </h3>
          
          <div className="space-y-2">
            {sortedOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                  overlay.id === canvasState.selectedOverlayId
                    ? 'bg-primary bg-opacity-10 border-l-4 border-primary'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => onSelectOverlay(overlay.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Eye className={`h-3 w-3 ${overlay.id === canvasState.selectedOverlayId ? 'text-primary' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900">{overlay.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Layer {overlay.layer + 1} • {overlay.width}x{overlay.height}px
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7h2v10H8zm6 0h2v10h-2z"/>
                  </svg>
                </Button>
              </div>
            ))}

            {canvasState.baseImage && (
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Image className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Base Image</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Background Layer</div>
                </div>
                <Lock className="h-3 w-3 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Export Section */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Export Options</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Format</Label>
              <Select defaultValue="png">
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Quality</Label>
              <Select defaultValue="high">
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-white"
            onClick={handleExport}
            disabled={isExporting || !canvasState.baseImage}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Tank Design'}
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            Final image will include watermark and all coral layers
          </div>
        </div>
      </div>
    </aside>
  );
}
