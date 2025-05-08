
import React from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, Settings } from "lucide-react";
import ApiKeyConfig from "./ApiKeyConfig";

interface ChatHeaderProps {
  onEndCall: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onEndCall }) => {
  return (
    <div className="flex justify-between items-center p-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="flex items-center">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">AI Voice Assistant</h1>
          <p className="text-sm text-muted-foreground">Voice conversation</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ApiKeyConfig />
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={onEndCall}
          className="flex items-center gap-1"
        >
          <PhoneOff className="h-4 w-4" />
          <span>End Call</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
