import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Clock, Award, Play, CheckCircle, Timer } from "lucide-react";
import Header from "@/components/Header";

interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  type: "Location" | "Treasure" | "Challenge";
  status: "Available" | "In Progress" | "Completed";
  estimatedTime: string;
  requirements?: string[];
}

const Quests = () => {
  const [selectedTab, setSelectedTab] = useState("all");

  const quests: Quest[] = [
    {
      id: "1",
      title: "Library Explorer",
      description: "Navigate through the ancient literature section and find the hidden book that contains a secret message about campus history.",
      location: "Main Library - Floor 3",
      difficulty: "Easy",
      points: 100,
      type: "Location",
      status: "Available",
      estimatedTime: "15 min",
      requirements: ["Library access card"],
    },
    {
      id: "2",
      title: "Science Lab Mystery",
      description: "Solve the chemistry puzzle in Lab 204 by identifying the correct chemical compounds and their reactions.",
      location: "Science Building - Lab 204",
      difficulty: "Hard",
      points: 300,
      type: "Challenge",
      status: "Available",
      estimatedTime: "45 min",
      requirements: ["Science building access", "Basic chemistry knowledge"],
    },
    {
      id: "3",
      title: "Cafeteria Treasure",
      description: "Discover the secret menu item by following hidden clues throughout the cafeteria and kitchen areas.",
      location: "Student Cafeteria",
      difficulty: "Medium",
      points: 200,
      type: "Treasure",
      status: "In Progress",
      estimatedTime: "30 min",
    },
    {
      id: "4",
      title: "Sports Hall Challenge",
      description: "Complete the athletic achievement course and set a new personal record in three different sports activities.",
      location: "Sports Complex - Main Hall",
      difficulty: "Medium",
      points: 250,
      type: "Challenge",
      status: "Available",
      estimatedTime: "60 min",
      requirements: ["Athletic wear", "Sports equipment access"],
    },
    {
      id: "5",
      title: "Art Gallery Quest",
      description: "Identify the mysterious painting's hidden message by studying the artistic elements and historical context.",
      location: "Art Building - Gallery",
      difficulty: "Easy",
      points: 150,
      type: "Location",
      status: "Completed",
      estimatedTime: "25 min",
    },
    {
      id: "6",
      title: "Campus History Hunt",
      description: "Uncover the founding stories of the university by visiting historical markers around campus.",
      location: "Multiple Campus Locations",
      difficulty: "Medium",
      points: 180,
      type: "Treasure",
      status: "Available",
      estimatedTime: "40 min",
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-success";
      case "Medium": return "bg-warning";
      case "Hard": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available": return Play;
      case "In Progress": return Timer;
      case "Completed": return CheckCircle;
      default: return Play;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Location": return MapPin;
      case "Treasure": return Star;
      case "Challenge": return Award;
      default: return MapPin;
    }
  };

  const filteredQuests = quests.filter(quest => {
    if (selectedTab === "all") return true;
    if (selectedTab === "available") return quest.status === "Available";
    if (selectedTab === "in-progress") return quest.status === "In Progress";
    if (selectedTab === "completed") return quest.status === "Completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Campus Quests</h1>
          <p className="text-muted-foreground">
            Explore exciting challenges and discover hidden treasures around campus
          </p>
        </div>

        {/* Quest Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="all">All Quests</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuests.map((quest) => {
                const StatusIcon = getStatusIcon(quest.status);
                const TypeIcon = getTypeIcon(quest.type);
                
                return (
                  <Card
                    key={quest.id}
                    className="group hover:shadow-quest transition-all duration-300 transform hover:scale-[1.02] bg-gradient-card"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-4 h-4 text-primary" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {quest.type}
                          </Badge>
                        </div>
                        <Badge className={getDifficultyColor(quest.difficulty)}>
                          {quest.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold">
                        {quest.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {quest.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Quest Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{quest.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{quest.estimatedTime}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-warning">
                          <Star className="w-4 h-4" />
                          <span className="font-medium">{quest.points} points</span>
                        </div>
                      </div>

                      {/* Requirements */}
                      {quest.requirements && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
                          <div className="flex flex-wrap gap-1">
                            {quest.requirements.map((req, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        {quest.status === "Available" && (
                          <Button variant="default" className="w-full group-hover:shadow-glow transition-all duration-300">
                            <Play className="w-4 h-4 mr-2" />
                            Start Quest
                          </Button>
                        )}
                        {quest.status === "In Progress" && (
                          <Button variant="secondary" className="w-full">
                            <Timer className="w-4 h-4 mr-2" />
                            Continue Quest
                          </Button>
                        )}
                        {quest.status === "Completed" && (
                          <Button variant="success" className="w-full" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredQuests.length === 0 && (
              <Card className="bg-gradient-card shadow-card-custom">
                <CardContent className="text-center py-12">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No quests found in this category
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats Summary */}
        <Card className="bg-gradient-card shadow-card-custom">
          <CardHeader>
            <CardTitle>Quest Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {quests.filter(q => q.status === "Completed").length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {quests.filter(q => q.status === "In Progress").length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {quests.filter(q => q.status === "Available").length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {quests.reduce((sum, q) => q.status === "Completed" ? sum + q.points : sum, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quests;