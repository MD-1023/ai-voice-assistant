
import { toast } from "@/components/ui/sonner";
import { DEEPGRAM_API_KEY } from './config';

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
