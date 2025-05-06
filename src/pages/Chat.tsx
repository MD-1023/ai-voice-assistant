
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { PhoneOff } from "lucide-react";
import RecordButton from "@/components/RecordButton";
import AudioVisualizer from "@/components/AudioVisualizer";
import MessageBubble from "@/components/MessageBubble";
import { 
  transcribeAudio, 
  getAIResponse, 
  textToSpeech, 
  getUserData, 
  saveUserData,
  saveAnalytics,
  saveFAQ,
  Message
} from "@/lib/api";

interface LocationState {
  name: string;
  email: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name = "", email = "" } = (location.state as LocationState) || {};
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Load user conversation history
  useEffect(() => {
    if (!email) {
      navigate("/");
      return;
    }
    
    const userData = getUserData(email);
    if (!userData) {
      navigate("/");
      return;
    }
    
    // Get the current/last conversation
    const currentConversation = userData.conversations[userData.conversations.length - 1];
    if (currentConversation) {
      setMessages(currentConversation.messages);
      
      // If no messages yet, greet the user
      if (currentConversation.messages.length === 0) {
        const greeting = `Hello ${name}! I am your AI Voice Assistant. How may I help you today?`;
        const greetingMessage = { role: "assistant", content: greeting };
        
        setMessages([greetingMessage]);
        currentConversation.messages.push(greetingMessage);
        saveUserData(userData);
        
        // Speak the greeting
        speakText(greeting);
      }
    }
    
    // Request microphone permissions
    setupMicrophone();
    
    // Clean up resources
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);
  
  // Scroll to the most recent message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const setupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        if (audioBlob.size > 0) {
          setIsProcessing(true);
          handleAudioSubmission(audioBlob);
        }
      };
      
      setMediaRecorder(recorder);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions and try again.");
    }
  };
  
  const toggleRecording = () => {
    if (!mediaRecorder) {
      toast.error("Microphone initialization failed. Please reload the page.");
      return;
    }
    
    if (isSpeaking) {
      toast.info("Please wait for the assistant to finish speaking.");
      return;
    }
    
    if (isRecording) {
      setIsRecording(false);
      mediaRecorder.stop();
    } else {
      setIsRecording(true);
      audioChunksRef.current = [];
      mediaRecorder.start();
    }
  };
  
  const handleAudioSubmission = async (audioBlob: Blob) => {
    try {
      // Convert speech to text
      const transcript = await transcribeAudio(audioBlob);
      
      if (!transcript.trim()) {
        setIsProcessing(false);
        toast.info("I couldn't hear anything. Please try again.");
        return;
      }
      
      // Add user message
      const userMessage = { role: "user", content: transcript };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Get AI response
      const aiResponseText = await getAIResponse(updatedMessages);
      const assistantMessage = { role: "assistant", content: aiResponseText };
      
      // Update messages with AI response
      setMessages([...updatedMessages, assistantMessage]);
      
      // Save conversation
      const userData = getUserData(email);
      if (userData) {
        const currentConversation = userData.conversations[userData.conversations.length - 1];
        currentConversation.messages = [...updatedMessages, assistantMessage];
        saveUserData(userData);
      }
      
      // Save analytics and FAQ
      saveAnalytics(transcript, aiResponseText);
      saveFAQ(transcript, aiResponseText);
      
      // Speak the response
      await speakText(aiResponseText);
      
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Error processing your request. Please try again.");
      setIsProcessing(false);
    }
  };
  
  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Get speech audio
      const audioBuffer = await textToSpeech(text);
      
      // Play the audio
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioContext = audioContextRef.current;
      const audioSource = audioContext.createBufferSource();
      
      audioContext.decodeAudioData(audioBuffer, (buffer) => {
        audioSource.buffer = buffer;
        audioSource.connect(audioContext.destination);
        
        audioSource.onended = () => {
          setIsSpeaking(false);
        };
        
        audioSource.start();
      });
    } catch (error) {
      console.error("Error playing speech:", error);
      setIsSpeaking(false);
    }
  };
  
  const endCall = () => {
    navigate("/");
  };

  // If no user information, redirect to home
  if (!email || !name) {
    useEffect(() => {
      navigate("/");
    }, []);
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-accent animate-pulse"></div>
          <h1 className="font-semibold text-xl">AI Voice Assistant</h1>
        </div>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={endCall}
        >
          <PhoneOff className="mr-2 h-4 w-4" />
          End Call
        </Button>
      </header>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
      >
        {messages.map((message, index) => (
          <MessageBubble 
            key={index} 
            content={message.content} 
            isUser={message.role === "user"} 
          />
        ))}
        
        {(isRecording || isSpeaking || isProcessing) && (
          <div className="flex justify-center">
            <AudioVisualizer isRecording={isRecording} isSpeaking={isSpeaking} />
          </div>
        )}
      </div>
      
      {/* Recording Controls */}
      <div className="p-4 border-t border-border/40 flex justify-center">
        <RecordButton 
          isRecording={isRecording} 
          onClick={toggleRecording} 
          disabled={isProcessing || isSpeaking}
        />
      </div>
      
      {/* Status Indicator */}
      <div className="pb-4 text-center text-sm text-muted-foreground">
        {isRecording && "Listening..."}
        {isProcessing && "Processing..."}
        {isSpeaking && "Speaking..."}
        {!isRecording && !isProcessing && !isSpeaking && "Click to start talking"}
      </div>
    </div>
  );
};

export default Chat;
