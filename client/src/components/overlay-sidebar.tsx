import { useState, useMemo, useRef } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, Filter, Upload, X } from "lucide-react";
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
            {coral.name.toLowerCase().includes('soft') && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Soft</Badge>
            )}
            {coral.name.toLowerCase().includes('zoa') && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Zoa</Badge>
            )}
            {coral.name.toLowerCase().includes('clam') && (
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">Clam</Badge>
            )}
            
            {/* Detect and show colors */}
            {coral.name.toLowerCase().includes('green') && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Green</Badge>
            )}
            {coral.name.toLowerCase().includes('blue') && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Blue</Badge>
            )}
            {coral.name.toLowerCase().includes('red') && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Red</Badge>
            )}
            {coral.name.toLowerCase().includes('pink') && (
              <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">Pink</Badge>
            )}
            {coral.name.toLowerCase().includes('purple') && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Purple</Badge>
            )}
            {coral.name.toLowerCase().includes('yellow') && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Yellow</Badge>
            )}
            {coral.name.toLowerCase().includes('orange') && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Orange</Badge>
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
  const [customCorals, setCustomCorals] = useState<CoralData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract available types from coral data
  const coralTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    coralData.forEach(coral => {
      const name = coral.name.toLowerCase();
      if (name.includes('sps')) typeCounts['sps'] = (typeCounts['sps'] || 0) + 1;
      if (name.includes('lps')) typeCounts['lps'] = (typeCounts['lps'] || 0) + 1;
      if (name.includes('soft')) typeCounts['soft'] = (typeCounts['soft'] || 0) + 1;
      if (name.includes('zoa')) typeCounts['zoa'] = (typeCounts['zoa'] || 0) + 1;
      if (name.includes('clam')) typeCounts['clam'] = (typeCounts['clam'] || 0) + 1;
    });
    
    return Object.entries(typeCounts);
  }, [coralData]);

  // Extract available colors from coral data based on current type filter
  const availableColors = useMemo(() => {
    let filteredData = coralData;
    
    if (typeFilter !== "all") {
      filteredData = coralData.filter(coral => 
        coral.name.toLowerCase().includes(typeFilter)
      );
    }
    
    const colorCounts: Record<string, number> = {};
    
    filteredData.forEach(coral => {
      const name = coral.name.toLowerCase();
      if (name.includes('green')) colorCounts['green'] = (colorCounts['green'] || 0) + 1;
      if (name.includes('blue')) colorCounts['blue'] = (colorCounts['blue'] || 0) + 1;
      if (name.includes('red')) colorCounts['red'] = (colorCounts['red'] || 0) + 1;
      if (name.includes('pink')) colorCounts['pink'] = (colorCounts['pink'] || 0) + 1;
      if (name.includes('purple')) colorCounts['purple'] = (colorCounts['purple'] || 0) + 1;
      if (name.includes('yellow')) colorCounts['yellow'] = (colorCounts['yellow'] || 0) + 1;
      if (name.includes('orange')) colorCounts['orange'] = (colorCounts['orange'] || 0) + 1;
    });
    
    return Object.entries(colorCounts);
  }, [coralData, typeFilter]);

  // Filter and randomize coral data
  const filteredCoralData = useMemo(() => {
    let filtered = coralData.filter(coral => {
      const name = coral.name.toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || name.includes(typeFilter);
      const matchesColor = colorFilter === "all" || name.includes(colorFilter);
      
      return matchesSearch && matchesType && matchesColor;
    });
    
    // Shuffle the array based on randomSeed
    const shuffled = [...filtered];
    let currentIndex = shuffled.length;
    let randomIndex;
    
    // Use randomSeed to create deterministic randomness
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    let seed = randomSeed;
    while (currentIndex != 0) {
      randomIndex = Math.floor(seededRandom(seed++) * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }
    
    return shuffled;
  }, [coralData, searchTerm, typeFilter, colorFilter, randomSeed]);

  const handleRandomize = () => {
    setRandomSeed(prev => prev + 1);
  };

  const handleCustomUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newCoral: CoralData = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''),
          fullImageUrl: result,
          thumbnailUrl: result,
          width: 150,
          height: 150,
        };
        setCustomCorals(prev => [...prev, newCoral]);
        console.log('Custom coral added:', newCoral.name, 'Total:', customCorals.length + 1);
      };
      reader.readAsDataURL(file);
    }
    // Clear the input value so the same file can be uploaded again
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeCustomCoral = (id: string) => {
    setCustomCorals(prev => prev.filter(coral => coral.id !== id));
  };

  return (
    <aside className="w-full md:w-80 bg-white border-r md:border-r border-b md:border-b-0 border-gray-200 flex flex-col">
      <div className="p-3 md:p-4 border-b border-gray-200">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Corals & Inverts</h2>
        
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="custom">Custom ({customCorals.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="database" className="mt-3">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search corals & inverts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types ({filteredCoralData.length})</SelectItem>
                  {coralTypes.map(([type, count]) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={colorFilter} onValueChange={setColorFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors ({filteredCoralData.length})</SelectItem>
                  {availableColors.map(([color, count]) => (
                    <SelectItem key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear filters and randomize buttons */}
            <div className="flex justify-between items-center mb-3">
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
          </TabsContent>
          
          <TabsContent value="custom" className="mt-3">
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Coral Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="hidden"
              />
              
              {customCorals.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Upload your own coral images to add them to your design
                </p>
              )}
              
              {/* Show uploaded custom corals here too */}
              <div className="space-y-3">
                {customCorals.map((coral) => (
                  <div key={coral.id} className="relative">
                    <DraggableCoralItem
                      coral={coral}
                      onAddOverlay={onAddOverlay}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white shadow-sm"
                      onClick={() => removeCustomCoral(coral.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <ScrollArea className="flex-1 p-3 md:p-4">
        <Tabs defaultValue="database" className="w-full">
          <TabsContent value="database" className="mt-0">
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
                {filteredCoralData.slice(0, 5).map((coral) => (
                  <DraggableCoralItem
                    key={coral.id}
                    coral={coral}
                    onAddOverlay={onAddOverlay}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          

        </Tabs>
      </ScrollArea>
    </aside>
  );
}