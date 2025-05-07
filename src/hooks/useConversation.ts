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
  const previousTopicsRef = useRef<string[]>([]);

  // Load or initialize conversation
  const loadConversation = () => {
    const userData = getUserData(email);
    if (!userData) return false;
    
    // Get the current/last conversation
    const currentConversation = userData.conversations[userData.conversations.length - 1];
    if (currentConversation) {
      // Check if this is a returning user with existing conversations
      if (currentConversation.messages.length > 0) {
        // Extract conversation messages excluding system messages
        const actualMessages = currentConversation.messages.filter(
          msg => msg.role !== "system"
        );
        
        // Save the actual conversation messages but don't display yet
        if (actualMessages.length > 0) {
          setMessages([]);
          previousTopicsRef.current = extractConversationTopics(actualMessages);
          
          // Generate personalized welcome back message
          let welcomeBackMessage = `Hello ${name}! I remember our previous conversation`;
          
          if (previousTopicsRef.current.length > 0) {
            welcomeBackMessage += ` about ${previousTopicsRef.current.join(", ")}. Would you like to continue that conversation or would you like assistance with something else?`;
          } else {
            welcomeBackMessage += `. Would you like to continue where we left off or would you like assistance with something else?`;
          }
          
          const greetingMessage: Message = { role: "assistant", content: welcomeBackMessage };
          
          // Display only the greeting message to the user
          setMessages([greetingMessage]);
          
          // Speak the welcome back message
          setTimeout(() => {
            speakText(welcomeBackMessage);
          }, 300);
          
          return true;
        }
      }
      
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
      
      return true;
    }
    return false;
  };

  // Extract main topics from previous conversation
  const extractConversationTopics = (conversationMessages: Message[]): string[] => {
    // Get only user messages
    const userMessages = conversationMessages.filter(msg => msg.role === "user");
    
    if (userMessages.length === 0) return [];
    
    // Define keywords that represent common topics
    const keywordMap: Record<string, string> = {
      "password": "password reset",
      "reset": "account resets",
      "account": "account management",
      "login": "login issues",
      "billing": "billing questions",
      "payment": "payment methods",
      "subscription": "subscription details",
      "cancel": "cancellation procedures",
      "update": "account updates",
      "problem": "technical issues",
      "help": "customer support",
      "question": "general inquiries",
      "email": "email settings"
    };
    
    const detectedTopics: string[] = [];
    
    // Look through all messages for keywords
    userMessages.forEach(message => {
      const messageContent = message.content.toLowerCase();
      
      // Check for each keyword in the message
      Object.entries(keywordMap).forEach(([keyword, topic]) => {
        if (messageContent.includes(keyword) && !detectedTopics.includes(topic)) {
          detectedTopics.push(topic);
        }
      });
    });
    
    // If no specific topics detected, use the last message content
    if (detectedTopics.length === 0 && userMessages.length > 0) {
      const lastMessage = userMessages[userMessages.length - 1].content;
      // Get first 3-5 words as a topic
      const words = lastMessage.split(" ");
      const simpleTopic = words.slice(0, Math.min(5, words.length)).join(" ");
      return ['"' + simpleTopic + '..."'];
    }
    
    return detectedTopics.slice(0, 3); // Limit to 3 topics max
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
      const aiResponseText = await getAIResponse(
        // Filter out the greeting message when sending to AI
        updatedMessages.filter(msg => 
          !(msg.role === "assistant" && 
            (msg.content.startsWith(`Hello ${name}! I remember`) || 
             msg.content === `Hello ${name}! I am your AI Voice Assistant. How may I help you today?`))
        )
      );
      const assistantMessage: Message = { role: "assistant", content: aiResponseText };
      
      // Update messages with AI response
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save conversation immediately, but exclude the welcome back greeting
      const userData = getUserData(email);
      if (userData) {
        const currentConversation = userData.conversations[userData.conversations.length - 1];
        
        // Store all messages except the welcome back greeting
        const messagesToStore = finalMessages.filter(msg => 
          !(msg.role === "assistant" && msg.content.startsWith(`Hello ${name}! I remember`))
        );
        
        currentConversation.messages = messagesToStore;
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
      
      // Clean text for speech by removing special characters that shouldn't be spoken
      const cleanedText = cleanTextForSpeech(text);
      
      // Get speech audio
      const audioBuffer = await textToSpeech(cleanedText);
      
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
  
  // Clean text for speech by removing special characters that shouldn't be spoken
  const cleanTextForSpeech = (text: string): string => {
    // Remove asterisks (markdown bold/italics)
    let cleanedText = text.replace(/\*/g, "");
    
    // Remove quotes that would be spoken
    cleanedText = cleanedText.replace(/["']/g, "");
    
    // Remove markdown links and keep only the text
    cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    
    // Remove other special characters that might be incorrectly spoken
    cleanedText = cleanedText.replace(/[_#>`]/g, "");
    
    return cleanedText;
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
