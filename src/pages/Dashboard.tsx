
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { getAnalytics, getFAQs, getUsersData } from "@/lib/api";
import AnalyticsCard from "@/components/AnalyticsCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalInteractions: 0,
    questions: {},
    topicFrequency: {}
  });
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string; count: number }>>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  
  useEffect(() => {
    // Load analytics data
    const analyticsData = getAnalytics();
    setAnalytics(analyticsData);
    
    // Load FAQs
    const faqsData = getFAQs();
    setFaqs(faqsData);
    
    // Get total users
    const users = getUsersData();
    setTotalUsers(users.length);
  }, []);
  
  const goBack = () => {
    navigate("/");
  };
  
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </header>
        
        {/* Overview Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalInteractions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">FAQs Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{faqs.length}</div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="analytics" className="mt-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="faqs">Frequent Questions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-6">
              <AnalyticsCard
                title="Common Topics"
                description="Frequency of different topics discussed"
                data={analytics.topicFrequency}
                type="pie"
              />
              
              <AnalyticsCard
                title="Questions Frequency"
                description="Most common questions from users"
                data={analytics.questions}
                type="bar"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="faqs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions users have asked the AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.length > 0 ? (
                  faqs
                    .sort((a, b) => b.count - a.count)
                    .map((faq, index) => (
                      <div
                        key={index}
                        className="border border-border rounded-lg p-4 space-y-2"
                      >
                        <h3 className="font-medium text-lg flex items-center justify-between">
                          <span>{faq.question}</span>
                          <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded-full">
                            {faq.count} {faq.count === 1 ? "time" : "times"}
                          </span>
                        </h3>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No questions have been asked yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
