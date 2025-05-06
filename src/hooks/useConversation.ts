
import { useState, useRef, useEffect } from "react";
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
import { toast } from "@/components/ui/sonner";

interface UseConversationProps {
  name: string;
  email: string;
}

export function useConversation({ name, email }: UseConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Load or initialize conversation
  const loadConversation = () => {
    const userData = getUserData(email);
    if (!userData) return false;
    
    // Get the current/last conversation
    const currentConversation = userData.conversations[userData.conversations.length - 1];
    if (currentConversation) {
      setMessages(currentConversation.messages);
      
      // If no messages yet, greet the user
      if (currentConversation.messages.length === 0) {
        const greeting = `Hello ${name}! I am your AI Voice Assistant. How may I help you today?`;
        const greetingMessage: Message = { role: "assistant", content: greeting };
        
        setMessages([greetingMessage]);
        currentConversation.messages.push(greetingMessage);
        saveUserData(userData);
        
        // Speak the greeting
        setTimeout(() => {
          speakText(greeting);
        }, 300);
      }
      return true;
    }
    return false;
  };

  const handleAudioSubmission = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      // Convert speech to text
      const transcript = await transcribeAudio(audioBlob);
      
      if (!transcript.trim()) {
        setIsProcessing(false);
        toast.info("I couldn't hear anything. Please try again.");
        return;
      }
      
      // Add user message
      const userMessage: Message = { role: "user", content: transcript };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Get AI response
      const aiResponseText = await getAIResponse(updatedMessages);
      const assistantMessage: Message = { role: "assistant", content: aiResponseText };
      
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
      
      // Stop any current audio
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      }
      
      const audioSource = audioContext.createBufferSource();
      audioSourceRef.current = audioSource;
      
      audioContext.decodeAudioData(audioBuffer, (buffer) => {
        audioSource.buffer = buffer;
        audioSource.connect(audioContext.destination);
        
        audioSource.onended = () => {
          setIsSpeaking(false);
          audioSourceRef.current = null;
        };
        
        audioSource.start();
      }, (err) => {
        console.error("Error decoding audio:", err);
        setIsSpeaking(false);
        toast.error("Failed to play speech. Please try again.");
      });
    } catch (error) {
      console.error("Error playing speech:", error);
      setIsSpeaking(false);
      toast.error("Failed to play speech. Please try again.");
    }
  };

  const cleanup = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Make sure to clean up when unmounting
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    messages,
    isSpeaking,
    isProcessing,
    loadConversation,
    handleAudioSubmission,
    speakText,
    cleanup
  };
}
