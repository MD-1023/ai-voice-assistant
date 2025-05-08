import { toast } from "@/components/ui/sonner";
import { ELEVENLABS_API_KEY } from './config';

// Clean text for speech by removing special characters that shouldn't be spoken
export const cleanTextForSpeech = (text: string): string => {
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

// Text to speech with ElevenLabs - modified to handle quota errors better
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    // Fallback for ElevenLabs API issues - using browser's built-in TTS
    const useFallbackTTS = (message: string): Promise<ArrayBuffer> => {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(message);
        const voices = window.speechSynthesis.getVoices();
        // Try to find a good voice
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Google') || 
          voice.name.includes('Samantha')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
        
        // Create a simple audio sample to return
        const audioContext = new AudioContext();
        const emptyBuffer = audioContext.createBuffer(1, 1, 22050);
        const arrayBuffer = emptyBuffer.getChannelData(0).buffer;
        resolve(arrayBuffer);
      });
    };
    
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
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        console.error("ElevenLabs error, using fallback:", await response.text());
        toast.info("Using browser's text-to-speech due to API limitations.");
        return await useFallbackTTS(cleanedText);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error with ElevenLabs, using fallback:", error);
      toast.info("Using browser's text-to-speech due to API limitations.");
      return await useFallbackTTS(text);
    }
  } catch (error) {
    console.error("Text-to-speech completely failed:", error);
    toast.error("Failed to generate speech. Please try again.");
    throw error;
  }
};
