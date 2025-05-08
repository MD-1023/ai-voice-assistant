
// API configuration
export let DEEPGRAM_API_KEY = localStorage.getItem("deepgram_api_key") || "98cd0f8512f4819f289a5db105a8cf087d3b4b1b";
export let OPENAI_API_KEY = localStorage.getItem("openai_api_key") || "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";
export let ELEVENLABS_API_KEY = localStorage.getItem("elevenlabs_api_key") || "sk_53cf2b4248a93dbf9f1b1c59f9c7c5c9be6abff9212155f7";

// Function to update API keys at runtime
export const updateApiKeys = ({ 
  openaiKey, 
  elevenLabsKey, 
  deepgramKey 
}: { 
  openaiKey: string; 
  elevenLabsKey: string; 
  deepgramKey: string 
}) => {
  if (openaiKey) {
    OPENAI_API_KEY = openaiKey;
    localStorage.setItem("openai_api_key", openaiKey);
  }
  
  if (elevenLabsKey) {
    ELEVENLABS_API_KEY = elevenLabsKey;
    localStorage.setItem("elevenlabs_api_key", elevenLabsKey);
  }
  
  if (deepgramKey) {
    DEEPGRAM_API_KEY = deepgramKey;
    localStorage.setItem("deepgram_api_key", deepgramKey);
  }
};

// Define system prompt for OpenAI
export const SYSTEM_PROMPT = `
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
