import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Clock, Award, Play, CheckCircle, Timer } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase"; // Make sure your Firebase is initialized here

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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Campus Quests</h1>
          <p className="text-muted-foreground">
            Explore exciting challenges and discover hidden treasures around campus
          </p>
        </div>

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
                          <Badge variant="outline" className="text-xs">{quest.type}</Badge>
                        </div>
                        <Badge className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold">{quest.title}</CardTitle>
                      <CardDescription className="text-sm">{quest.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
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

                      {quest.requirements?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
                          <div className="flex flex-wrap gap-1">
                            {quest.requirements.map((req, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{req}</Badge>
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
        <Card className="bg-gradient-card shadow-card-custom">
          <CardHeader>
            <CardTitle>Quest Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{quests.filter(q => q.status === "Completed").length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{quests.filter(q => q.status === "In Progress").length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">{quests.filter(q => q.status === "Available").length}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{quests.reduce((sum, q) => q.status === "Completed" ? sum + q.points : sum, 0)}</div>
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
