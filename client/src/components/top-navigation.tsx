import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plug, Settings, HelpCircle, CheckCircle2, Layers, Mail } from "lucide-react";

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
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="https://i.ibb.co/Z6g9TGRC/Screen-Shot-2024-03-05-at-1-43-18-AM.png"
            alt="CoralScape"
            className="h-12 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<h1 class="text-xl font-bold text-gray-900">CoralScape</h1>';
              }
            }}
          />
        </div>
        
        <div className="flex items-center space-x-4 flex-1 max-w-2xl mx-4">
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
