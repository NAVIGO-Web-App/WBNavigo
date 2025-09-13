import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Clock, Award, Play, CheckCircle, Timer } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useTheme } from "@/contexts/ThemeContext";

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
  position: { lat: number; lng: number };
}

const Quests = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [quests, setQuests] = useState<Quest[]>([]);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchQuests = async () => {
      const snapshot = await getDocs(collection(db, "quests"));
      const data: Quest[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const [lat, lng] = d.building.split(",").map((x: string) => parseFloat(x));
        return {
          id: doc.id,
          title: d.title,
          description: d.description,
          location: d.title,
          difficulty: d.difficulty || "Medium",
          points: d.rewardPoints,
          type: d.type || "Location",
          status: d.status === "active" ? "Available" : "Completed",
          estimatedTime: d.estimatedTime || "30 min",
          requirements: d.requirements || [],
          position: { lat, lng },
        };
      });
      setQuests(data);
    };
    fetchQuests();
  }, []);

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

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted dark:bg-gray-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              All Quests
            </TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              Available
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuests.map((quest) => {
                const StatusIcon = getStatusIcon(quest.status);
                const TypeIcon = getTypeIcon(quest.type);

                return (
                  <Card
                    key={quest.id}
                    className="group hover:shadow-quest transition-all duration-300 transform hover:scale-[1.02] bg-card dark:bg-gray-800 dark:border-gray-700"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-4 h-4 text-primary" />
                          </div>
                          <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">{quest.type}</Badge>
                        </div>
                        <Badge className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold dark:text-white">{quest.title}</CardTitle>
                      <CardDescription className="text-sm dark:text-gray-300">{quest.description}</CardDescription>
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
                            onClick={() => navigate("/map", { state: { quest } })}
                          >
                            {quest.status === "Available" ? <Play className="w-4 h-4 mr-2" /> : <Timer className="w-4 h-4 mr-2" />}
                            {quest.status === "Available" ? "Start Quest" : "Continue Quest"}
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