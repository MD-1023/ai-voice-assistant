
import { toast } from "@/components/ui/sonner";
import { Message } from './types';
import { OPENAI_API_KEY, SYSTEM_PROMPT } from './config';

// Get AI response from OpenAI
export const getAIResponse = async (messages: Message[]): Promise<string> => {
  // Check if API key is available and valid format
  if (!OPENAI_API_KEY) {
    toast.error("Missing OpenAI API key. Please configure in settings.");
    return "I'm sorry, but my AI service is not configured. Please set up an OpenAI API key by clicking 'Configure API Keys' at the top of the screen.";
  }

  // Log the key format (first few chars only) for debugging
  console.log("Using OpenAI key format:", OPENAI_API_KEY.substring(0, 7) + "...");
  
  // Additional check for project key formats that won't work
  if (OPENAI_API_KEY.startsWith("sk-proj-")) {
    toast.error("Using a project-based OpenAI API key which may not have proper permissions. Please use a standard API key.");
    return "I'm sorry, but it seems you're using a project-based OpenAI API key. These keys may have limited permissions. Please use a standard API key that starts with 'sk-' instead.";
  }

  try {
    console.log("Making request to OpenAI API...");
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
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 401) {
        toast.error("Invalid OpenAI API key. Please update in settings.");
        console.error("Auth error with OpenAI. Key may be invalid or revoked.");
        return "I'm sorry, but my AI service couldn't authenticate with OpenAI. Please check and update your API key by clicking 'Configure API Keys' at the top of the screen.";
      } else if (response.status === 429) {
        toast.error("OpenAI rate limit exceeded. Please try again later.");
        return "I'm sorry, but we've hit the rate limit for AI responses. Please try again in a moment.";
      } else {
        toast.error(`OpenAI API error: ${response.status}`);
        return "I'm sorry, I'm having trouble processing your request right now. Please try again.";
      }
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error getting AI response:", error);
    toast.error("Failed to get AI response. Please try again.");
    return "I'm sorry, I'm having trouble processing your request right now. Could you please try again?";
  }
};
