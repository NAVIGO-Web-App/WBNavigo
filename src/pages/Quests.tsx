import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Clock, Award, Play, CheckCircle, Timer } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuest } from "@/contexts/QuestContext"; // Make sure this import exists

// Remove the old Quest interface since it's now in QuestContext
// Remove the old parseCoordinates function since it's now in QuestContext
// Remove the old fetchQuests logic since it's now in QuestContext

const Quests = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const { 
    quests, 
    loading, 
    startQuest, 
    userProgress, 
    activeQuest, 
    canStartQuest 
  } = useQuest(); // USE THE HOOK TO GET THESE VALUES
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleStartQuest = async (quest: any) => {
    // Check if user can start this quest
    if (!canStartQuest(quest.id)) {
      // Show requirements not met message
      const missingRequirements = quest.requiredQuests?.filter((reqId: string) => 
        !userProgress.completedQuests.includes(reqId)
      ) || [];
      
      const missingQuestNames = missingRequirements.map((reqId: string) => {
        const requiredQuest = quests.find(q => q.id === reqId);
        return requiredQuest?.title || "Unknown Quest";
      }).join(", ");
      
      if (missingQuestNames) {
        alert(`You need to complete these quests first: ${missingQuestNames}`);
      } else {
        alert("You cannot start this quest yet. Complete the required quests first.");
      }
      return;
    }

    // If another quest is active, show switch confirmation
    if (activeQuest && activeQuest.questId !== quest.id) {
      const currentQuest = quests.find(q => q.id === activeQuest.questId);
      const confirmSwitch = window.confirm(
        `You're currently working on "${currentQuest?.title}". Do you want to switch to "${quest.title}"? Your progress will be saved.`
      );
      
      if (!confirmSwitch) return;
    }

    const success = await startQuest(quest.id);
    if (success) {
      // Navigate to MAP page to show the path and directions
      navigate('/map', { state: { autoSelectQuest: quest.id } });
    } else {
      alert("Failed to start quest. Please try again.");
    }
  };

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

  const filteredQuests = quests.filter((quest) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "available") return quest.status === "Available";
    if (selectedTab === "in-progress") return quest.status === "In Progress";
    if (selectedTab === "completed") return quest.status === "Completed";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground dark:text-gray-300">Loading quests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Campus Quests</h1>
          <p className="text-muted-foreground dark:text-gray-300">
            Explore exciting challenges and discover hidden treasures around campus
          </p>
        </div>

        {/* Active Quest Banner */}
        {activeQuest && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Active Quest: {quests.find(q => q.id === activeQuest.questId)?.title}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Continue your current adventure!
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/map')}
              >
                View on Map
              </Button>
            </div>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted dark:bg-gray-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              All Quests ({quests.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              Available ({quests.filter(q => q.status === "Available").length})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              In Progress ({quests.filter(q => q.status === "In Progress").length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              Completed ({quests.filter(q => q.status === "Completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {filteredQuests.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground dark:text-gray-300 text-lg">
                  {selectedTab === "all" 
                    ? "No quests found" 
                    : `No ${selectedTab.replace('-', ' ')} quests found`
                  }
                </p>
                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                  Check back later for new quests!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuests.map((quest) => {
                  const StatusIcon = getStatusIcon(quest.status);
                  const TypeIcon = getTypeIcon(quest.type);

                  // Check if quest has requirements that aren't met
                  const hasUnmetRequirements = quest.requiredQuests && 
                    quest.requiredQuests.some(reqId => !userProgress.completedQuests.includes(reqId));

                  return (
                    <Card
                      key={quest.id}
                      className={`group hover:shadow-quest transition-all duration-300 transform hover:scale-[1.02] bg-card dark:bg-gray-800 dark:border-gray-700 ${
                        hasUnmetRequirements ? "opacity-60" : ""
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                              <TypeIcon className="w-4 h-4 text-primary" />
                            </div>
                            <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                              {quest.type}
                            </Badge>
                          </div>
                          <Badge className={getDifficultyColor(quest.difficulty)}>
                            {quest.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-semibold dark:text-white">{quest.title}</CardTitle>
                        <CardDescription className="text-sm dark:text-gray-300">{quest.description}</CardDescription>
                        
                        {/* Requirements Warning */}
                        {hasUnmetRequirements && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                            <p className="text-yellow-800 dark:text-yellow-200">
                              Complete required quests first
                            </p>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2 text-muted-foreground dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{quest.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{quest.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-warning dark:text-yellow-400">
                            <Star className="w-4 h-4" />
                            <span className="font-medium">{quest.points} points</span>
                          </div>
                        </div>

                        {quest.requirements?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground dark:text-gray-400">Requirements:</p>
                            <div className="flex flex-wrap gap-1">
                              {quest.requirements.map((req, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs dark:bg-gray-600 dark:text-gray-300">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          {(quest.status === "Available" || quest.status === "In Progress") && (
                            <Button
                              variant={quest.status === "Available" ? "default" : "secondary"}
                              className="w-full"
                              onClick={() => handleStartQuest(quest)}
                              disabled={hasUnmetRequirements}
                            >
                              {quest.status === "Available" ? <Play className="w-4 h-4 mr-2" /> : <Timer className="w-4 h-4 mr-2" />}
                              {quest.status === "Available" 
                                ? (hasUnmetRequirements ? "Requirements Needed" : "Start Quest")
                                : "Continue Quest"
                              }
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
            )}
          </TabsContent>
        </Tabs>

        {/* Quick summary */}
        <Card className="bg-card dark:bg-gray-800 dark:border-gray-700 shadow-card-custom">
          <CardHeader>
            <CardTitle className="dark:text-white">Quest Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary dark:text-blue-400">{quests.filter(q => q.status === "Completed").length}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary dark:text-purple-400">{quests.filter(q => q.status === "In Progress").length}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning dark:text-yellow-400">{quests.filter(q => q.status === "Available").length}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success dark:text-green-400">{quests.reduce((sum, q) => q.status === "Completed" ? sum + q.points : sum, 0)}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quests;