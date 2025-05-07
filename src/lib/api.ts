
import { toast } from "@/components/ui/sonner";

// API configuration
const DEEPGRAM_API_KEY = "0655664639c1a9b1d5adb9c9f1ed19cf10257348";
const OPENAI_API_KEY = "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";
const ELEVENLABS_API_KEY = "sk_daa1ffbe11bd110b007ac32fdcf02bcfb6ad74d7329becd3";

// Define system prompt for OpenAI
const SYSTEM_PROMPT = `
You are a helpful and friendly AI voice assistant providing customer support.
Your goal is to help users with their account questions, technical issues, and other inquiries.
Be conversational, helpful, and make the user feel valued and heard.
Use a friendly tone and be concise in your responses.

When helping users, follow these guidelines:
- If the user asks about resetting passwords, guide them through the process step by step
- If the user asks for specific information, provide clear answers
- If the user asks about account details, ask for verification information first
- Be empathetic and understanding
- Remember information from previous exchanges in the conversation
- Do not use special characters like asterisks or quotation marks in your responses as they will be spoken aloud
`;

// Interface for conversation history
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Interface for user data
export interface UserData {
  name: string;
  email: string;
  conversations: {
    date: string;
    messages: Message[];
  }[];
}

// Store user data in local storage
export const saveUserData = (userData: UserData): void => {
  const existingUsers = getUsersData();
  const userIndex = existingUsers.findIndex(user => user.email === userData.email);
  
  if (userIndex >= 0) {
    existingUsers[userIndex] = userData;
  } else {
    existingUsers.push(userData);
  }
  
  localStorage.setItem("aiAssistantUsers", JSON.stringify(existingUsers));
  console.log("Saved user data:", userData);
};

// Get all users data
export const getUsersData = (): UserData[] => {
  const data = localStorage.getItem("aiAssistantUsers");
  return data ? JSON.parse(data) : [];
};

// Get specific user data
export const getUserData = (email: string): UserData | undefined => {
  const users = getUsersData();
  const userData = users.find(user => user.email === email);
  console.log("Retrieved user data for email:", email, userData);
  return userData;
};

// Speech to text with Deepgram
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to transcribe audio: ${response.status}`);
    }

    const data = await response.json();
    return data.results.channels[0].alternatives[0].transcript || "";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    toast.error("Failed to transcribe audio. Please try again.");
    return "";
  }
};

// Get AI response from OpenAI
export const getAIResponse = async (messages: Message[]): Promise<string> => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error getting AI response:", error);
    toast.error("Failed to get AI response. Please try again.");
    return "I'm sorry, I'm having trouble processing your request right now. Could you please try again?";
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

// Text to speech with ElevenLabs
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const cleanedText = cleanTextForSpeech(text);
    const voice_id = "EXAVITQu4vr4xnSDxMaL"; // Using Sarah voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: "eleven_turbo_v2", // Using the faster model for lower latency
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      console.error("ElevenLabs TTS error:", await response.text());
      throw new Error(`Failed to convert text to speech: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error converting text to speech:", error);
    toast.error("Failed to generate speech. Please try again.");
    throw error;
  }
};

// Save conversation analytics
export const saveAnalytics = (question: string, response: string): void => {
  // Get existing analytics
  const analyticsData = localStorage.getItem("aiAssistantAnalytics");
  const analytics = analyticsData ? JSON.parse(analyticsData) : {
    totalInteractions: 0,
    questions: {},
    topicFrequency: {}
  };
  
  // Update analytics
  analytics.totalInteractions += 1;
  
  // Extract topic from question (simple keyword extraction)
  const keywords = ["password", "reset", "account", "login", "billing", "payment", "subscription", "cancel", "update", "problem"];
  
  const detectedTopics = keywords.filter(keyword => question.toLowerCase().includes(keyword));
  
  detectedTopics.forEach(topic => {
    analytics.topicFrequency[topic] = (analytics.topicFrequency[topic] || 0) + 1;
  });
  
  // Store question
  const shortQuestion = question.substring(0, 100);
  analytics.questions[shortQuestion] = (analytics.questions[shortQuestion] || 0) + 1;
  
  // Save back to localStorage
  localStorage.setItem("aiAssistantAnalytics", JSON.stringify(analytics));
};

// Get analytics data for dashboard
export const getAnalytics = () => {
  const analyticsData = localStorage.getItem("aiAssistantAnalytics");
  return analyticsData ? JSON.parse(analyticsData) : {
    totalInteractions: 0,
    questions: {},
    topicFrequency: {}
  };
};

// Save FAQ data
export const saveFAQ = (question: string, answer: string): void => {
  const faqs = getFAQs();
  const existingIndex = faqs.findIndex(faq => faq.question === question);
  
  if (existingIndex >= 0) {
    faqs[existingIndex].count += 1;
  } else {
    faqs.push({ question, answer, count: 1 });
  }
  
  localStorage.setItem("aiAssistantFAQs", JSON.stringify(faqs));
};

// Get FAQ data
export const getFAQs = () => {
  const faqData = localStorage.getItem("aiAssistantFAQs");
  return faqData ? JSON.parse(faqData) : [];
};
