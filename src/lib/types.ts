
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

// Analytics data structure
export interface AnalyticsData {
  totalInteractions: number;
  questions: Record<string, number>;
  topicFrequency: Record<string, number>;
}

// FAQ data structure
export interface FAQItem {
  question: string;
  answer: string;
  count: number;
}
