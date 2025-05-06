
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { saveUserData, getUserData, UserData } from "@/lib/api";

const Index = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    // Check if user exists or create new user
    let userData = getUserData(email);
    
    if (!userData) {
      userData = {
        name,
        email,
        conversations: []
      };
    }
    
    // Add a new conversation if needed
    if (!userData.conversations.length || 
        userData.conversations[userData.conversations.length - 1].messages.length > 0) {
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
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Enter your details below to start a conversation with your AI assistant
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
                  onChange={(e) => setName(e.target.value)}
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
                  onChange={(e) => setEmail(e.target.value)}
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
      
      <footer className="mt-8 text-muted-foreground text-center text-sm">
        <p>Powered by Deepgram & OpenAI</p>
      </footer>
    </div>
  );
};

export default Index;
