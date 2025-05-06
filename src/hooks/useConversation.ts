
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
      // If there are existing messages, check if this is a returning user
      if (currentConversation.messages.length > 0) {
        setMessages(currentConversation.messages);
        
        // Generate a welcome back message based on previous conversation
        const previousTopics = extractConversationTopics(currentConversation.messages);
        let welcomeBackMessage = `Hello ${name}!`;
        
        if (previousTopics.length > 0) {
          welcomeBackMessage += ` I remember our previous conversation about ${previousTopics.join(", ")}. Would you like to continue that conversation or would you like assistance with something else?`;
        } else {
          welcomeBackMessage += ` I remember our previous conversation. Would you like to continue or would you like assistance with something else?`;
        }
        
        const greetingMessage: Message = { role: "assistant", content: welcomeBackMessage };
        const updatedMessages = [...currentConversation.messages, greetingMessage];
        
        setMessages(updatedMessages);
        currentConversation.messages = updatedMessages;
        saveUserData(userData);
        
        // Speak the welcome back message
        setTimeout(() => {
          speakText(welcomeBackMessage);
        }, 300);
      } else {
        // If no messages yet, greet the user as new
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

  // Extract main topics from previous conversation
  const extractConversationTopics = (conversationMessages: Message[]): string[] => {
    // Get only user messages
    const userMessages = conversationMessages.filter(msg => msg.role === "user");
    
    if (userMessages.length === 0) return [];
    
    // Extract keywords from conversation
    const keywords = ["password", "reset", "account", "login", "billing", "payment", "subscription", "cancel", "update", "problem"];
    
    // Find matches in the last message for simplicity
    const lastMessage = userMessages[userMessages.length - 1].content.toLowerCase();
    const detectedTopics = keywords.filter(keyword => lastMessage.includes(keyword));
    
    // If no specific topics detected, use generic description
    if (detectedTopics.length === 0) {
      // Try to get a simple topic from the last message
      const simpleTopic = lastMessage.split(" ").slice(0, 3).join(" ");
      return simpleTopic.length > 10 ? ["your previous questions"] : [`"${simpleTopic}..."`];
    }
    
    return detectedTopics;
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
      
      // Prepare for speech before getting response to reduce latency
      if (audioContextRef.current && audioContextRef.current.state !== 'running') {
        try {
          await audioContextRef.current.resume();
        } catch (e) {
          console.error("Error resuming audio context:", e);
        }
      }
      
      // Get AI response
      const aiResponseText = await getAIResponse(updatedMessages);
      const assistantMessage: Message = { role: "assistant", content: aiResponseText };
      
      // Update messages with AI response
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save conversation immediately
      const userData = getUserData(email);
      if (userData) {
        const currentConversation = userData.conversations[userData.conversations.length - 1];
        currentConversation.messages = finalMessages;
        saveUserData(userData);
      }
      
      // Save analytics and FAQ
      saveAnalytics(transcript, aiResponseText);
      saveFAQ(transcript, aiResponseText);
      
      // Start speech synthesis immediately
      speakText(aiResponseText);
      
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
          setIsProcessing(false);
          audioSourceRef.current = null;
        };
        
        audioSource.start();
      }, (err) => {
        console.error("Error decoding audio:", err);
        setIsSpeaking(false);
        setIsProcessing(false);
        toast.error("Failed to play speech. Please try again.");
      });
    } catch (error) {
      console.error("Error playing speech:", error);
      setIsSpeaking(false);
      setIsProcessing(false);
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
