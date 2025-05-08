import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { saveUserData, getUserData } from "@/lib/userData";

const Index = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Load previously used name and email
  useEffect(() => {
    const lastSession = localStorage.getItem("lastSession");
    if (lastSession) {
      const { name: savedName, email: savedEmail } = JSON.parse(lastSession);
      setName(savedName || "");
      setEmail(savedEmail || "");
      
      // Check if this is a returning user with existing conversations
      checkIfReturningUser(savedEmail);
    }
  }, []);
  
  // Helper function to check if a user is returning with conversations
  const checkIfReturningUser = (email: string) => {
    if (!email) return;
    
    // Check conversation history directly
    const history = JSON.parse(localStorage.getItem("conversation_history") || "[]");
    
    // Look for user's previous conversations in history
    const hasConversations = history.some((conv: any) => {
      return conv.messages && conv.messages.some((msg: any) => 
        msg.role === "assistant" && 
        msg.content && 
        msg.content.includes(`Hello ${name}!`)
      );
    });
    
    setIsReturningUser(hasConversations);
  };

  const handleStartTalking = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter both name and email.");
      return;
    }
    
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Save current session
    localStorage.setItem("lastSession", JSON.stringify({ name, email }));
    
    // Check if user exists or create new user
    let userData = getUserData(email);
    
    if (!userData) {
      userData = {
        name,
        email,
        conversations: []
      };
    } else {
      // Update the name in case it changed
      userData.name = name;
    }
    
    // Add a new conversation if needed (or if the last one is empty)
    const lastConversation = userData.conversations[userData.conversations.length - 1];
    if (!userData.conversations.length || 
        (lastConversation && lastConversation.messages.filter(msg => msg.role !== "system").length > 0)) {
      userData.conversations.push({
        date: new Date().toISOString(),
        messages: []
      });
    }
    
    // Save updated user data
    saveUserData(userData);
    
    // Navigate to chat page
    setTimeout(() => {
      navigate("/chat", { state: { name, email } });
    }, 500);
  };
  
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // When email changes, check if it's a returning user
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    checkIfReturningUser(newEmail);
  };
  
  // When name changes, check if combination creates a returning user
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (email) {
      checkIfReturningUser(email);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 sm:p-6 relative">
      <Button 
        variant="outline" 
        className="absolute top-4 right-4"
        onClick={goToDashboard}
      >
        Dashboard
      </Button>
      
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            AI Voice Assistant
          </h1>
          <p className="text-muted-foreground">
            Your personal AI assistant that understands and helps you
          </p>
        </div>
        
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Welcome{isReturningUser ? " Back" : ""}</CardTitle>
            <CardDescription>
              {isReturningUser 
                ? "Continue your conversation with your AI assistant"
                : "Enter your details below to start a conversation with your AI assistant"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartTalking} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.smith@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Starting..." : "Start Talking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
