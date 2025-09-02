import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Award } from "lucide-react";
import Header from "@/components/Header";

interface QuestMarker {
  id: string;
  title: string;
  description: string;
  location: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  type: "Location" | "Treasure" | "Challenge";
  status: "Available" | "In Progress" | "Completed";
  position: { x: number; y: number };
}

const CampusMap = () => {
  const [selectedQuest, setSelectedQuest] = useState<QuestMarker | null>(null);

  const questMarkers: QuestMarker[] = [
    {
      id: "1",
      title: "Library Explorer",
      description: "Find the hidden book in the ancient literature section",
      location: "Main Library",
      difficulty: "Easy",
      points: 100,
      type: "Location",
      status: "Available",
      position: { x: 25, y: 35 },
    },
    {
      id: "2",
      title: "Science Lab Mystery",
      description: "Solve the chemistry puzzle in Lab 204",
      location: "Science Building",
      difficulty: "Hard",
      points: 300,
      type: "Challenge",
      status: "Available",
      position: { x: 65, y: 25 },
    },
    {
      id: "3",
      title: "Cafeteria Treasure",
      description: "Discover the secret menu item through hidden clues",
      location: "Student Cafeteria",
      difficulty: "Medium",
      points: 200,
      type: "Treasure",
      status: "In Progress",
      position: { x: 45, y: 60 },
    },
    {
      id: "4",
      title: "Sports Hall Challenge",
      description: "Complete the athletic achievement course",
      location: "Sports Complex",
      difficulty: "Medium",
      points: 250,
      type: "Challenge",
      status: "Available",
      position: { x: 80, y: 45 },
    },
    {
      id: "5",
      title: "Art Gallery Quest",
      description: "Identify the mysterious painting's hidden message",
      location: "Art Building",
      difficulty: "Easy",
      points: 150,
      type: "Location",
      status: "Completed",
      position: { x: 15, y: 70 },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-primary";
      case "In Progress": return "bg-secondary";
      case "Completed": return "bg-success";
      default: return "bg-muted";
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  <span>Campus Quest Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-muted/20 rounded-lg overflow-hidden" style={{ aspectRatio: "16/10" }}>
                  {/* Campus Map Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5">
                    {/* Campus Buildings (simplified representation) */}
                    <div className="absolute top-[20%] left-[20%] w-16 h-12 bg-card rounded border border-border shadow-sm">
                      <div className="text-xs text-center mt-2 text-muted-foreground">Library</div>
                    </div>
                    <div className="absolute top-[15%] left-[60%] w-16 h-12 bg-card rounded border border-border shadow-sm">
                      <div className="text-xs text-center mt-2 text-muted-foreground">Science</div>
                    </div>
                    <div className="absolute top-[50%] left-[40%] w-16 h-12 bg-card rounded border border-border shadow-sm">
                      <div className="text-xs text-center mt-2 text-muted-foreground">Cafeteria</div>
                    </div>
                    <div className="absolute top-[35%] left-[75%] w-16 h-12 bg-card rounded border border-border shadow-sm">
                      <div className="text-xs text-center mt-2 text-muted-foreground">Sports</div>
                    </div>
                    <div className="absolute top-[60%] left-[10%] w-16 h-12 bg-card rounded border border-border shadow-sm">
                      <div className="text-xs text-center mt-2 text-muted-foreground">Art</div>
                    </div>
                  </div>

                  {/* Quest Markers */}
                  {questMarkers.map((quest) => {
                    const Icon = getTypeIcon(quest.type);
                    return (
                      <button
                        key={quest.id}
                        onClick={() => setSelectedQuest(quest)}
                        className={`absolute w-8 h-8 rounded-full ${getStatusColor(quest.status)} shadow-quest hover:shadow-glow transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-primary-foreground`}
                        style={{
                          left: `${quest.position.x}%`,
                          top: `${quest.position.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>

                {/* Map Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                    <span className="text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-secondary rounded-full"></div>
                    <span className="text-muted-foreground">In Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-success rounded-full"></div>
                    <span className="text-muted-foreground">Completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quest Details */}
          <div className="space-y-6">
            {selectedQuest ? (
              <Card className="bg-gradient-card shadow-quest">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{selectedQuest.title}</CardTitle>
                    <Badge className={getDifficultyColor(selectedQuest.difficulty)}>
                      {selectedQuest.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{selectedQuest.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{selectedQuest.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-warning" />
                      <span>{selectedQuest.points} points</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Type: {selectedQuest.type}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    {selectedQuest.status === "Available" && (
                      <Button variant="default" className="w-full">
                        Start Quest
                      </Button>
                    )}
                    {selectedQuest.status === "In Progress" && (
                      <Button variant="secondary" className="w-full">
                        Continue Quest
                      </Button>
                    )}
                    {selectedQuest.status === "Completed" && (
                      <Button variant="success" className="w-full" disabled>
                        Completed ✓
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-card shadow-card-custom">
                <CardContent className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Click on a quest marker to view details
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-gradient-card shadow-card-custom">
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Quests</span>
                  <span className="font-semibold text-success">1/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Points</span>
                  <span className="font-semibold text-primary">150</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rank</span>
                  <span className="font-semibold text-secondary">#42</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;