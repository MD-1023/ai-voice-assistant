
import { AnalyticsData, FAQItem, Message } from './types';

// Save conversation analytics
export const saveAnalytics = (question: string, response: string): void => {
  // Get existing analytics
  const analyticsData = localStorage.getItem("aiAssistantAnalytics");
  const analytics: AnalyticsData = analyticsData ? JSON.parse(analyticsData) : {
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
export const getAnalytics = (): AnalyticsData => {
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
export const getFAQs = (): FAQItem[] => {
  const faqData = localStorage.getItem("aiAssistantFAQs");
  return faqData ? JSON.parse(faqData) : [];
};

// Extract topics from user messages
export const extractTopicsFromMessages = (messages: Message[]): string[] => {
  // Get only user messages
  const userMessages = messages.filter(msg => msg.role === "user").slice(-3);
  
  if (userMessages.length === 0) return [];
  
  // Define keywords for topics detection
  const topicKeywords: Record<string, string> = {
    "weather": "the weather forecast",
    "calendar": "your calendar",
    "email": "email communications",
    "send": "sending information",
    "renewable": "renewable energy",
    "energy": "energy topics",
    "time": "time management",
    "management": "management strategies",
    "meeting": "scheduling meetings",
    "book": "booking appointments",
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
    "question": "general inquiries"
  };
  
  // Extract topics from user messages
  const topics = userMessages.map(msg => {
    const content = msg.content.toLowerCase();
    
    // Check for each keyword
    for (const [keyword, topic] of Object.entries(topicKeywords)) {
      if (content.includes(keyword)) {
        return topic;
      }
    }
    
    return "various topics";
  });
  
  // Get unique topics
  return Array.from(new Set(topics));
};
