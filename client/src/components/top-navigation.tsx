import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plug, Settings, HelpCircle, CheckCircle2, Layers, Mail, Coffee, Palette } from "lucide-react";

interface TopNavigationProps {
  onConnect: () => void;
  isConnecting: boolean;
  isConnected: boolean;
}

export default function TopNavigation({
  onConnect,
  isConnecting,
  isConnected,
}: TopNavigationProps) {
  const [colorWheelUrl, setColorWheelUrl] = useState<string>('');

  useEffect(() => {
    // Fetch color wheel from Google Sheets
    const fetchColorWheel = async () => {
      try {
        // Fetch from sheet 2, column A, row 2 of the specific spreadsheet
        // First try to get sheet 2 using different common GIDs
        const possibleGids = ['669674685', '1555555555', '2000000000', '1'];
        
        for (const gid of possibleGids) {
          try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/1j4ZgG9NFOfB_H4ExYY8mKzUQuflXmRa6pP8fsdDxt-4/export?format=csv&gid=${gid}`;
            console.log(`Trying color wheel with GID: ${gid}`);
            const response = await fetch(csvUrl);
            
            if (response.ok) {
              const csvData = await response.text();
              console.log(`Color wheel CSV data for GID ${gid}:`, csvData.substring(0, 200));
              const rows = csvData.split('\n');
              
              // Check if this looks like sheet 2 data (not the main coral data)
              if (rows.length >= 2 && !rows[0].includes('Id,Name,ImageUrl')) {
                const row2 = rows[1]; // Row 2 (index 1)
                const columns = row2.split(',').map(col => col.trim().replace(/"/g, ''));
                
                if (columns.length > 0 && columns[0]) {
                  const url = columns[0];
                  console.log('Color wheel URL found in sheet 2, row 2:', url);
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    setColorWheelUrl(url);
                    return; // Success, stop trying other GIDs
                  }
                }
              }
            }
          } catch (error) {
            console.log(`Failed to fetch with GID ${gid}:`, error);
            continue; // Try next gid
          }
        }
      } catch (error) {
        console.error('Failed to fetch color wheel:', error);
      }
    };

    fetchColorWheel();
  }, []);
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img 
            src="https://i.ibb.co/Z6g9TGRC/Screen-Shot-2024-03-05-at-1-43-18-AM.png"
            alt="CoralScape"
            className="h-12 md:h-15 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<h1 class="text-xl font-bold text-gray-900">CoralScape</h1>';
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 hidden sm:flex"
            onClick={() => window.open('https://buymeacoffee.com/coralscape', '_blank')}
          >
            <span className="mr-2">🪸</span>
            <span className="hidden md:inline">Buy me a frag</span>
            <span className="md:hidden">🪸</span>
          </Button>
        </div>
        
        <div className="hidden md:flex items-center space-x-4 flex-1 max-w-2xl mx-4">
          <div className="flex-1 text-center">

          </div>
          
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className={`whitespace-nowrap ${
              isConnected 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : isConnected ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Connected
              </>
            ) : (
              <>
                <Plug className="mr-2 h-4 w-4" />
                Load Database
              </>
            )}
          </Button>
          
        </div>

        <div className="flex items-center space-x-2">
          {colorWheelUrl && (
            <img 
              src={colorWheelUrl}
              alt="Color Wheel"
              className="h-12 md:h-15 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                console.log('Color wheel image failed to load:', colorWheelUrl);
              }}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem asChild>
                <a 
                  href="mailto:inquiries.coralscape@gmail.com"
                  className="flex items-center cursor-pointer"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  inquiries.coralscape@gmail.com
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
