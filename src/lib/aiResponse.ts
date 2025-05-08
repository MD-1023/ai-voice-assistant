
import { toast } from "@/components/ui/sonner";
import { Message } from './types';
import { OPENAI_API_KEY, SYSTEM_PROMPT } from './config';

// Get AI response from OpenAI
export const getAIResponse = async (messages: Message[]): Promise<string> => {
  // Check if API key is available
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith("sk-proj-")) {
    toast.error("Invalid or missing OpenAI API key. Please configure in settings.");
    return "I'm sorry, but my AI service is not properly configured. Please set up a valid OpenAI API key by clicking 'Configure API Keys' at the top of the screen.";
  }

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
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 401) {
        toast.error("Invalid OpenAI API key. Please update in settings.");
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
