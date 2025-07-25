import { Button } from "@/components/ui/button";
import { Loader2, Plug, Settings, HelpCircle, CheckCircle2, Layers } from "lucide-react";

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
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <Layers className="text-primary mr-2 h-6 w-6" />
            CoralScape Designer
          </h1>
        </div>
        
        <div className="flex items-center space-x-4 flex-1 max-w-2xl mx-4">
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-600">
              Coral & Invertebrate Database
            </p>
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
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
