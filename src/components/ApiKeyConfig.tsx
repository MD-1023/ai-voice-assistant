
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

  // Save the API keys
  const handleSave = () => {
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
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for AI responses
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyConfig;
