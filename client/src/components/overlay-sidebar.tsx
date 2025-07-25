import { useState } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { CoralData } from "@shared/schema";

interface OverlaySidebarProps {
  coralData: CoralData[];
  isLoading: boolean;
  onAddOverlay: (coral: CoralData, position: { x: number; y: number }) => void;
}

interface DraggableCoralItemProps {
  coral: CoralData;
  onAddOverlay: (coral: CoralData, position: { x: number; y: number }) => void;
}

function DraggableCoralItem({ coral, onAddOverlay }: DraggableCoralItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'coral',
    item: { coral },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`group cursor-grab active:cursor-grabbing bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border border-transparent hover:border-primary transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <img
          src={coral.thumbnailUrl}
          alt={coral.name}
          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAyOEgzNlYzNkgyOFYyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{coral.name}</h3>
          <p className="text-sm text-gray-500">{coral.width}x{coral.height}</p>
          <div className="flex items-center mt-1">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ready
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverlaySidebar({ coralData, isLoading, onAddOverlay }: OverlaySidebarProps) {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Coral & Invertebrates</h2>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{coralData.length} specimens loaded</span>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-auto p-1">
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : coralData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l2 2-2 2M5 4l2 2-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Specimens Available</h3>
            <p className="text-gray-600">Connect to Google Sheets to load coral and invertebrate data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coralData.map((coral) => (
              <DraggableCoralItem
                key={coral.id}
                coral={coral}
                onAddOverlay={onAddOverlay}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
