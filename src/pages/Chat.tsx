
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import ChatControls from "@/components/ChatControls";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useConversation } from "@/hooks/useConversation";

interface LocationState {
  name: string;
  email: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name = "", email = "" } = (location.state as LocationState) || {};
  
  const [initialized, setInitialized] = useState(false);
  
  const conversation = useConversation({ name, email });
  
  const { isRecording, setupMicrophone, toggleRecording } = useAudioRecording({
    onRecordingComplete: conversation.handleAudioSubmission
  });
  
  // Load user conversation history and setup microphone
  useEffect(() => {
    if (!email) {
      navigate("/");
      return;
    }
    
    const loaded = conversation.loadConversation();
    if (!loaded) {
      navigate("/");
      return;
    }
    
    // Setup microphone
    setupMicrophone();
    setInitialized(true);
    
    // Clean up resources on unmount
    return () => {
      conversation.cleanup();
    };
  }, [email]);
  
  const handleToggleRecording = () => {
    if (conversation.isSpeaking) {
      toast.info("Please wait for the assistant to finish speaking.");
      return;
    }
    
    toggleRecording();
  };
  
  const endCall = () => {
    navigate("/");
  };

  // If no user information, redirect to home
  if (!email || !name || !initialized) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onEndCall={endCall} />
      
      <ChatMessages 
        messages={conversation.messages}
        isRecording={isRecording}
        isSpeaking={conversation.isSpeaking}
        isProcessing={conversation.isProcessing}
      />
      
      <ChatControls 
        isRecording={isRecording}
        isProcessing={conversation.isProcessing}
        isSpeaking={conversation.isSpeaking}
        onToggleRecording={handleToggleRecording}
      />
    </div>
  );
};

export default Chat;
