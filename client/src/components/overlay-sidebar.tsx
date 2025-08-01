import { useState, useRef, useCallback } from "react";
import { 
  Search, 
  Upload, 
  X, 
  RefreshCw 
} from "lucide-react";
import { useDrop } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoralData } from "@shared/schema";
import { convertHeicToJpeg, isSupportedImageFile } from "@/lib/heic-converter";
import { useToast } from "@/hooks/use-toast";

interface OverlaySidebarProps {
  coralData: CoralData[];
  isLoading: boolean;
  onAddOverlay: (coral: CoralData, position: { x: number; y: number }) => void;
  hideSearchBar?: boolean; // For mobile/tablet layout
}

interface CustomCoral {
  id: string;
  name: string;
  imageUrl: string;
  fullName: string;
  type: string;
  subType: string;
  color: string;
  family: string;
}

interface DraggableCoralItemProps {
  coral: CoralData | CustomCoral;
  onAddOverlay: (coral: CoralData, position: { x: number; y: number }) => void;
}

function DraggableCoralItem({ coral, onAddOverlay }: DraggableCoralItemProps) {
  const handleClick = () => {
    // Place coral in center of canvas when clicked
    onAddOverlay(coral as CoralData, { x: 0.5, y: 0.5 });
  };

  return (
    <div className="group bg-background hover:bg-muted/50 rounded-lg p-2 border border-border transition-colors cursor-pointer"
         onClick={handleClick}>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <img
            src={coral.imageUrl}
            alt={coral.fullName}
            className="w-12 h-12 object-cover rounded border border-border"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {coral.fullName}
          </h3>
          <p className="text-xs text-muted-foreground capitalize mt-1">
            {coral.type} • {coral.color}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OverlaySidebar({ coralData, isLoading, onAddOverlay, hideSearchBar = false }: OverlaySidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [customCorals, setCustomCorals] = useState<CustomCoral[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get unique types, subtypes, and colors for filtering
  const coralTypes = Array.from(
    coralData.reduce((acc, coral) => {
      if (coral.type) {
        acc.set(coral.type.toLowerCase(), (acc.get(coral.type.toLowerCase()) || 0) + 1);
      }
      return acc;
    }, new Map<string, number>())
  ).sort(([a], [b]) => a.localeCompare(b));

  const availableSubTypes = Array.from(
    coralData
      .filter(coral => typeFilter === "all" || coral.type?.toLowerCase() === typeFilter)
      .reduce((acc, coral) => {
        if (coral.subType) {
          acc.set(coral.subType.toLowerCase(), (acc.get(coral.subType.toLowerCase()) || 0) + 1);
        }
        return acc;
      }, new Map<string, number>())
  ).sort(([a], [b]) => a.localeCompare(b));

  const availableColors = Array.from(
    coralData.reduce((acc, coral) => {
      if (coral.color) {
        acc.set(coral.color.toLowerCase(), (acc.get(coral.color.toLowerCase()) || 0) + 1);
      }
      return acc;
    }, new Map<string, number>())
  ).sort(([a], [b]) => a.localeCompare(b));

  // Filter coral data based on search and filters
  const filteredCoralData = coralData.filter(coral => {
    const matchesSearch = !searchTerm || 
      coral.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coral.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coral.subType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coral.color?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || coral.type?.toLowerCase() === typeFilter;
    const matchesSubType = subTypeFilter === "all" || coral.subType?.toLowerCase() === subTypeFilter;
    const matchesColor = colorFilter === "all" || coral.color?.toLowerCase() === colorFilter;
    
    return matchesSearch && matchesType && matchesSubType && matchesColor;
  });

  // Randomize coral order
  const handleRandomize = useCallback(() => {
    // This will trigger a re-render with the same data but different order via key changes
    const randomKey = Math.random();
    // We can't directly shuffle the data, but we can force a re-render
    setSearchTerm(searchTerm + randomKey.toString().slice(-1));
    setTimeout(() => setSearchTerm(searchTerm), 50);
  }, [searchTerm]);

  // Custom coral upload handler
  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let processedFile = file;
      
      // Convert HEIC files to JPEG if needed
      if (file.name.toLowerCase().includes('.heic') || file.name.toLowerCase().includes('.heif')) {
        if (!isSupportedImageFile(file)) {
          toast({
            title: "Unsupported File",
            description: "Please upload a valid image file (PNG, JPG, JPEG, HEIC, HEIF)",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Converting HEIC Image",
          description: "Converting your HEIC image to JPEG format...",
        });
        
        processedFile = await convertHeicToJpeg(file);
      }

      // Create object URL for the processed file
      const dataUrl = URL.createObjectURL(processedFile);
      
      // Create a temporary image to get dimensions
      const img = new Image();
      img.onload = () => {
        const customCoral: CustomCoral = {
          id: `custom-${Date.now()}`,
          name: file.name.split('.')[0].toLowerCase().replace(/\s+/g, '-'),
          fullName: file.name.split('.')[0],
          imageUrl: dataUrl,
          type: 'custom',
          subType: 'uploaded',
          color: 'custom',
          family: 'custom'
        };
        
        setCustomCorals(prev => [...prev, customCoral]);
        
        if (file.name.toLowerCase().includes('.heic')) {
          toast({
            title: "HEIC Conversion Complete",
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
    <aside className="w-full md:w-80 bg-background border-r md:border-r border-b md:border-b-0 border-border flex flex-col h-full">
      <div className="px-3 md:px-4 pt-2 md:pt-3 pb-1 md:pb-2 flex-shrink-0">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">Corals & Inverts</h2>
        
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="custom">Custom ({customCorals.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="database" className="mt-2">
            {/* Search Input - hidden on mobile/tablet */}
            {!hideSearchBar && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search corals & inverts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            )}

            {/* Filters */}
            <div className="space-y-1.5 mb-2">
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
            <div className="flex justify-between items-center mb-1">
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
          
          <TabsContent value="custom" className="mt-2">
            <div className="space-y-2">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Scrollable coral list */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-2 md:px-3">
          <div className="space-y-2 pb-2">
            {isLoading ? (
              <>
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
              </>
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
              <>
                {filteredCoralData.map((coral) => (
                  <DraggableCoralItem
                    key={coral.name}
                    coral={coral}
                    onAddOverlay={onAddOverlay}
                  />
                ))}
                {/* Show custom corals in database tab too */}
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
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}