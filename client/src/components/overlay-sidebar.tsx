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
import { convertHeicToJpeg, isSupportedImageFile } from "@/lib/heic-converter";
import { useToast } from "@/hooks/use-toast";

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
            {coral.name.toLowerCase().includes('anemone') && (
              <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">Anemone</Badge>
            )}
            {coral.name.toLowerCase().includes('nps') && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">NPS</Badge>
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
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [randomSeed, setRandomSeed] = useState(() => Math.random()); // Initialize with random value on page load
  const [customCorals, setCustomCorals] = useState<CoralData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      if (name.includes('anemone')) typeCounts['anemone'] = (typeCounts['anemone'] || 0) + 1;
      if (name.includes('nps')) typeCounts['nps'] = (typeCounts['nps'] || 0) + 1;
    });
    
    return Object.entries(typeCounts);
  }, [coralData]);

  // Get subcategories based on selected main type
  const availableSubTypes = useMemo(() => {
    if (typeFilter === "all") return [];
    
    let filteredData = coralData.filter(coral => 
      coral.name.toLowerCase().includes(typeFilter)
    );
    
    const subTypeCounts: Record<string, number> = {};
    
    if (typeFilter === 'sps') {
      filteredData.forEach(coral => {
        const name = coral.name.toLowerCase();
        if (name.includes('acropora')) subTypeCounts['acropora'] = (subTypeCounts['acropora'] || 0) + 1;
        if (name.includes('montipora')) subTypeCounts['montipora'] = (subTypeCounts['montipora'] || 0) + 1;
        if (name.includes('pocillopora')) subTypeCounts['pocillopora'] = (subTypeCounts['pocillopora'] || 0) + 1;
        if (name.includes('stylophora')) subTypeCounts['stylophora'] = (subTypeCounts['stylophora'] || 0) + 1;
        if (name.includes('seriatopora')) subTypeCounts['seriatopora'] = (subTypeCounts['seriatopora'] || 0) + 1;
      });
    } else if (typeFilter === 'lps') {
      filteredData.forEach(coral => {
        const name = coral.name.toLowerCase();
        if (name.includes('hammer')) subTypeCounts['hammer'] = (subTypeCounts['hammer'] || 0) + 1;
        if (name.includes('torch')) subTypeCounts['torch'] = (subTypeCounts['torch'] || 0) + 1;
        if (name.includes('frogspawn')) subTypeCounts['frogspawn'] = (subTypeCounts['frogspawn'] || 0) + 1;
        if (name.includes('bubble')) subTypeCounts['bubble'] = (subTypeCounts['bubble'] || 0) + 1;
        if (name.includes('plate')) subTypeCounts['plate'] = (subTypeCounts['plate'] || 0) + 1;
        if (name.includes('brain')) subTypeCounts['brain'] = (subTypeCounts['brain'] || 0) + 1;
        if (name.includes('elegance')) subTypeCounts['elegance'] = (subTypeCounts['elegance'] || 0) + 1;
        if (name.includes('micromussa')) subTypeCounts['micromussa'] = (subTypeCounts['micromussa'] || 0) + 1;
        if (name.includes('trachy')) subTypeCounts['trachy'] = (subTypeCounts['trachy'] || 0) + 1;
        if (name.includes('trachyphyllia')) subTypeCounts['trachyphyllia'] = (subTypeCounts['trachyphyllia'] || 0) + 1;
        if (name.includes('chalice')) subTypeCounts['chalice'] = (subTypeCounts['chalice'] || 0) + 1;
        if (name.includes('duncan')) subTypeCounts['duncan'] = (subTypeCounts['duncan'] || 0) + 1;
        if (name.includes('goniopora')) subTypeCounts['goniopora'] = (subTypeCounts['goniopora'] || 0) + 1;
        if (name.includes('alveopora')) subTypeCounts['alveopora'] = (subTypeCounts['alveopora'] || 0) + 1;
        if (name.includes('lobophyllia')) subTypeCounts['lobophyllia'] = (subTypeCounts['lobophyllia'] || 0) + 1;
        if (name.includes('symphyllia')) subTypeCounts['symphyllia'] = (subTypeCounts['symphyllia'] || 0) + 1;
        if (name.includes('scolymia')) subTypeCounts['scolymia'] = (subTypeCounts['scolymia'] || 0) + 1;
        if (name.includes('acanthophyllia')) subTypeCounts['acanthophyllia'] = (subTypeCounts['acanthophyllia'] || 0) + 1;
        if (name.includes('cynarina')) subTypeCounts['cynarina'] = (subTypeCounts['cynarina'] || 0) + 1;
        if (name.includes('catalaphyllia')) subTypeCounts['catalaphyllia'] = (subTypeCounts['catalaphyllia'] || 0) + 1;
      });
    } else if (typeFilter === 'soft') {
      filteredData.forEach(coral => {
        const name = coral.name.toLowerCase();
        if (name.includes('leather')) subTypeCounts['leather'] = (subTypeCounts['leather'] || 0) + 1;
        if (name.includes('mushroom')) subTypeCounts['mushroom'] = (subTypeCounts['mushroom'] || 0) + 1;
        if (name.includes('finger')) subTypeCounts['finger'] = (subTypeCounts['finger'] || 0) + 1;
        if (name.includes('tree')) subTypeCounts['tree'] = (subTypeCounts['tree'] || 0) + 1;
        if (name.includes('xenia')) subTypeCounts['xenia'] = (subTypeCounts['xenia'] || 0) + 1;
      });
    } else if (typeFilter === 'zoa') {
      filteredData.forEach(coral => {
        const name = coral.name.toLowerCase();
        if (name.includes('paly')) subTypeCounts['paly'] = (subTypeCounts['paly'] || 0) + 1;
        if (name.includes('button')) subTypeCounts['button'] = (subTypeCounts['button'] || 0) + 1;
        if (name.includes('radioactive')) subTypeCounts['radioactive'] = (subTypeCounts['radioactive'] || 0) + 1;
      });
    }
    
    return Object.entries(subTypeCounts);
  }, [coralData, typeFilter]);

  // Extract available colors from coral data based on current type and subtype filters
  const availableColors = useMemo(() => {
    let filteredData = coralData;
    
    if (typeFilter !== "all") {
      filteredData = filteredData.filter(coral => 
        coral.name.toLowerCase().includes(typeFilter)
      );
    }
    
    if (subTypeFilter !== "all") {
      filteredData = filteredData.filter(coral => 
        coral.name.toLowerCase().includes(subTypeFilter)
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
  }, [coralData, typeFilter, subTypeFilter]);

  // Filter and randomize coral data
  const filteredCoralData = useMemo(() => {
    let filtered = coralData.filter(coral => {
      const name = coral.name.toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || name.includes(typeFilter);
      const matchesSubType = subTypeFilter === "all" || name.includes(subTypeFilter);
      const matchesColor = colorFilter === "all" || name.includes(colorFilter);
      
      return matchesSearch && matchesType && matchesSubType && matchesColor;
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
  }, [coralData, searchTerm, typeFilter, subTypeFilter, colorFilter, randomSeed]);

  const handleRandomize = () => {
    setRandomSeed(prev => prev + 1);
  };

  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is supported
    if (!isSupportedImageFile(file)) {
      toast({
        title: "Unsupported File Format",
        description: "Please upload a JPEG, PNG, GIF, WebP, or HEIC image file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert HEIC files or read regular images
      const dataUrl = await convertHeicToJpeg(file);
      
      // Create an image element to get the actual dimensions
      const img = new Image();
      img.onload = () => {
        // Calculate proportional size while limiting maximum size
        const maxSize = 150;
        const aspectRatio = img.width / img.height;
        let newWidth = img.width;
        let newHeight = img.height;
        
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
        
        const newCoral: CoralData = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i, ''),
          fullImageUrl: dataUrl,
          thumbnailUrl: dataUrl,
          width: newWidth,
          height: newHeight,
        };
        setCustomCorals(prev => [...prev, newCoral]);
        console.log('Custom coral added:', newCoral.name, 'Dimensions:', newWidth, 'x', newHeight);
        
        if (file.name.toLowerCase().includes('.heic') || file.name.toLowerCase().includes('.heif')) {
          toast({
            title: "HEIC File Converted",
            description: "Your HEIC coral image has been successfully converted and added.",
          });
        }
      };
      img.src = dataUrl;
      
    } catch (error) {
      console.error('Custom coral upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload coral image. Please try again.",
        variant: "destructive",
      });
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
            <div className="space-y-2 mb-3">
              {/* Main Type Filter */}
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                setSubTypeFilter("all"); // Reset subtype when main type changes
              }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {coralTypes.map(([type, count]) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Subtype Filter - appears when main type is selected */}
              {availableSubTypes.length > 0 && (
                <div className="relative">
                  <Select value={subTypeFilter} onValueChange={setSubTypeFilter}>
                    <SelectTrigger className="text-sm ml-4 border-l-4 border-primary/30">
                      <SelectValue placeholder="Select Subtype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Types</SelectItem>
                      {availableSubTypes.map(([subType, count]) => (
                        <SelectItem key={subType} value={subType}>
                          {subType.charAt(0).toUpperCase() + subType.slice(1)} ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="absolute left-0 top-1/2 w-3 h-px bg-primary/30 transform -translate-y-1/2"></div>
                </div>
              )}
              
              {/* Color Filter */}
              <Select value={colorFilter} onValueChange={setColorFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
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
              {(searchTerm || typeFilter !== "all" || subTypeFilter !== "all" || colorFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700 h-auto p-1"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setSubTypeFilter("all");
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
                accept="image/*,.heic,.heif"
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
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-3">
                  {filteredCoralData.map((coral) => (
                    <DraggableCoralItem
                      key={coral.id}
                      coral={coral}
                      onAddOverlay={onAddOverlay}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          

        </Tabs>
      </ScrollArea>
    </aside>
  );
}