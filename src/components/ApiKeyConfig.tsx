
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { DEEPGRAM_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY } from "@/lib/config";
import { updateApiKeys } from "@/lib/config";

const ApiKeyConfig = () => {
  const [openaiKey, setOpenaiKey] = useState(OPENAI_API_KEY || "");
  const [elevenLabsKey, setElevenLabsKey] = useState(ELEVENLABS_API_KEY || "");
  const [deepgramKey, setDeepgramKey] = useState(DEEPGRAM_API_KEY || "");
  const [open, setOpen] = useState(false);

  // Validate OpenAI key format
  const validateOpenAIKey = (key: string) => {
    if (!key) return false;
    if (key.startsWith("sk-proj-")) {
      return false; // Project-based keys may not work correctly
    }
    return key.startsWith("sk-");
  };

  // Save the API keys
  const handleSave = () => {
    // Check OpenAI key format
    if (openaiKey && !validateOpenAIKey(openaiKey)) {
      toast.warning("Your OpenAI API key format looks incorrect. Keys typically start with 'sk-' (not 'sk-proj-')");
    }
    
    updateApiKeys({
      openaiKey: openaiKey,
      elevenLabsKey: elevenLabsKey,
      deepgramKey: deepgramKey
    });
    
    toast.success("API keys updated successfully");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Configure API Keys
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Keys Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="openai-key" className="text-sm font-medium block mb-1">
              OpenAI API Key
            </label>
            <Input 
              id="openai-key"
              value={openaiKey} 
              onChange={(e) => setOpenaiKey(e.target.value)} 
              placeholder="sk-..." 
              className={openaiKey && !validateOpenAIKey(openaiKey) ? "border-red-500" : ""}
            />
            {openaiKey && !validateOpenAIKey(openaiKey) && (
              <p className="text-xs text-red-500 mt-1">
                Warning: Key format looks incorrect. Standard OpenAI keys start with "sk-" (not "sk-proj-")
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Required for AI responses. Must be a standard OpenAI API key starting with "sk-"
            </p>
          </div>

          <div>
            <label htmlFor="elevenlabs-key" className="text-sm font-medium block mb-1">
              ElevenLabs API Key
            </label>
            <Input 
              id="elevenlabs-key"
              value={elevenLabsKey} 
              onChange={(e) => setElevenLabsKey(e.target.value)} 
              placeholder="..." 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for high-quality text-to-speech
            </p>
          </div>

          <div>
            <label htmlFor="deepgram-key" className="text-sm font-medium block mb-1">
              Deepgram API Key
            </label>
            <Input 
              id="deepgram-key" 
              value={deepgramKey} 
              onChange={(e) => setDeepgramKey(e.target.value)} 
              placeholder="..." 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for speech-to-text
            </p>
          </div>

          <Button onClick={handleSave} className="w-full mt-4">
            Save API Keys
          </Button>

          <p className="text-xs text-muted-foreground mt-2">
            Note: After updating keys, you may need to refresh the page or start a new conversation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyConfig;
