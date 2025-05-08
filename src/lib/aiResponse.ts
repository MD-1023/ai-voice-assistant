
import { toast } from "@/components/ui/sonner";
import { Message } from './types';
import { OPENAI_API_KEY, SYSTEM_PROMPT } from './config';

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
