import { useState, useMemo } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Filter } from "lucide-react";
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
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {/* Detect and show coral type */}
            {coral.name.toLowerCase().includes('sps') && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">SPS</Badge>
            )}
            {coral.name.toLowerCase().includes('lps') && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">LPS</Badge>
            )}
            {(coral.name.toLowerCase().includes('softy') || coral.name.toLowerCase().includes('soft')) && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Soft</Badge>
            )}
            {coral.name.toLowerCase().includes('zoa') && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Zoa</Badge>
            )}
            {coral.name.toLowerCase().includes('clam') && (
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">Clam</Badge>
            )}
            
            {/* Show color if detected */}
            {['blue', 'green', 'red', 'yellow', 'orange', 'purple', 'pink'].map(color => 
              coral.name.toLowerCase().includes(color) && (
                <Badge key={color} variant="secondary" className="text-xs" style={{
                  backgroundColor: color === 'blue' ? '#dbeafe' : 
                                  color === 'green' ? '#dcfce7' :
                                  color === 'red' ? '#fee2e2' :
                                  color === 'yellow' ? '#fef3c7' :
                                  color === 'orange' ? '#fed7aa' :
                                  color === 'purple' ? '#ede9fe' :
                                  color === 'pink' ? '#fce7f3' : '#f3f4f6',
                  color: color === 'blue' ? '#1e40af' : 
                         color === 'green' ? '#166534' :
                         color === 'red' ? '#dc2626' :
                         color === 'yellow' ? '#d97706' :
                         color === 'orange' ? '#ea580c' :
                         color === 'purple' ? '#7c3aed' :
                         color === 'pink' ? '#db2777' : '#374151'
                }}>
                  {color}
                </Badge>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverlaySidebar({ coralData, isLoading, onAddOverlay }: OverlaySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [randomSeed, setRandomSeed] = useState(0);

  // Extract unique types and colors with counts
  const { coralTypes, coralColors, typeBasedColors } = useMemo(() => {
    const typeCounts = new Map<string, number>();
    const colorCounts = new Map<string, number>();
    const typeColorMap = new Map<string, Map<string, number>>();
    
    coralData.forEach(coral => {
      const name = coral.name.toLowerCase();
      
      // Extract coral types
      const types: string[] = [];
      if (name.includes('sps')) types.push('sps');
      if (name.includes('lps')) types.push('lps');
      if (name.includes('softy') || name.includes('soft')) types.push('soft coral');
      if (name.includes('zoa') || name.includes('zoanthid')) types.push('zoanthid');
      if (name.includes('mushroom')) types.push('mushroom');
      if (name.includes('anemone')) types.push('anemone');
      if (name.includes('clam')) types.push('clam');
      if (name.includes('torch')) types.push('torch');
      if (name.includes('hammer')) types.push('hammer');
      if (name.includes('favia')) types.push('favia');
      if (name.includes('acropora') || name.includes('acro')) types.push('acropora');
      if (name.includes('montipora') || name.includes('monti')) types.push('montipora');
      
      // Extract colors
      const colors: string[] = [];
      if (name.includes('blue')) colors.push('blue');
      if (name.includes('green')) colors.push('green');
      if (name.includes('red')) colors.push('red');
      if (name.includes('yellow')) colors.push('yellow');
      if (name.includes('orange')) colors.push('orange');
      if (name.includes('purple')) colors.push('purple');
      if (name.includes('pink')) colors.push('pink');
      if (name.includes('white')) colors.push('white');
      if (name.includes('black')) colors.push('black');
      if (name.includes('brown')) colors.push('brown');
      if (name.includes('rainbow')) colors.push('rainbow');
      
      // Count types
      types.forEach(type => {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        
        // Build type-color mapping
        if (!typeColorMap.has(type)) {
          typeColorMap.set(type, new Map());
        }
        const typeColors = typeColorMap.get(type)!;
        colors.forEach(color => {
          typeColors.set(color, (typeColors.get(color) || 0) + 1);
        });
      });
      
      // Count colors
      colors.forEach(color => {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      });
    });
    
    return {
      coralTypes: Array.from(typeCounts.entries()).sort(([a], [b]) => a.localeCompare(b)),
      coralColors: Array.from(colorCounts.entries()).sort(([a], [b]) => a.localeCompare(b)),
      typeBasedColors: typeColorMap
    };
  }, [coralData]);

  // Get colors for selected type
  const availableColors = useMemo(() => {
    if (typeFilter === "all") {
      return coralColors;
    }
    
    const typeColors = typeBasedColors.get(typeFilter);
    if (!typeColors) return [];
    
    return Array.from(typeColors.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [typeFilter, coralColors, typeBasedColors]);

  // Filter and randomize coral data based on search and filters
  const filteredCoralData = useMemo(() => {
    const filtered = coralData.filter(coral => {
      const name = coral.name.toLowerCase();
      const searchMatch = name.includes(searchTerm.toLowerCase());
      
      const typeMatch = typeFilter === "all" || name.includes(typeFilter.toLowerCase());
      const colorMatch = colorFilter === "all" || name.includes(colorFilter.toLowerCase());
      
      return searchMatch && typeMatch && colorMatch;
    });
    
    // Simple seeded shuffle
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(((randomSeed + i) * 9301 + 49297) % 233280 / 233280 * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }, [coralData, searchTerm, typeFilter, colorFilter, randomSeed]);

  const handleRandomize = () => {
    setRandomSeed(prev => prev + 1);
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Corals & Inverts</h2>
        
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search corals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Filter Controls */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {coralTypes.map(([type, count]) => (
                    <SelectItem key={type} value={type}>
                      {type.toString().charAt(0).toUpperCase() + type.toString().slice(1)} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={colorFilter} onValueChange={setColorFilter}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {availableColors.map(([color, count]) => (
                    <SelectItem key={color} value={color}>
                      {color.toString().charAt(0).toUpperCase() + color.toString().slice(1)} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{filteredCoralData.length} of {coralData.length} specimens</span>
          <div className="flex items-center space-x-1">
            {(searchTerm || typeFilter !== "all" || colorFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 h-auto p-1"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setColorFilter("all");
                }}
              >
                Clear
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80 h-auto p-1"
              onClick={handleRandomize}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Randomize
            </Button>
          </div>
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
        ) : filteredCoralData.length === 0 && coralData.length > 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setColorFilter("all");
              }}
            >
              Clear Filters
            </Button>
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
            {filteredCoralData.map((coral) => (
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
