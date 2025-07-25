import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ExportSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportSuccessPopup({ isOpen, onClose }: ExportSuccessPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-green-700">
              🎉 Export Successful!
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <p className="text-gray-600 text-center">
            Your tank design has been exported successfully! 
          </p>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Love CoralScape? Support the project!
            </p>
            
            <Button
              variant="outline"
              className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              onClick={() => {
                window.open('https://buymeacoffee.com/coralscape', '_blank');
                onClose();
              }}
            >
              <span className="mr-2">🪸</span>
              Buy me a frag
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full"
            >
              Continue Designing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}