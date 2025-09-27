// Only these changes are needed - the dark: classes are CONDITIONAL
import { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuestTracker from "@/components/QuestTracker";
import { MapPin, Star, Clock } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { useTheme } from "@/contexts/ThemeContext"; // Add this import
import { ThemeToggle } from "@/components/ThemeToggle"; // Add this import
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
  position: { lat: number; lng: number };
}

const containerStyle = { width: "100%", height: "500px", borderRadius: "0.75rem" };
const center = { lat: -26.1915, lng: 28.0309 };

const parseCoordinates = (coord: string) => {
  const [latStr, lngStr] = coord.split(",");

  const parsePart = (str: string) => {
    const match = str.match(/([\d.]+)\s*°\s*([NSEW])/);
    if (!match) return 0;
    let value = parseFloat(match[1]);
    const dir = match[2];
    if (dir === "S" || dir === "W") value = -value;
    return value;
  };

  const lat = parsePart(latStr.trim());
  const lng = parsePart(lngStr.trim());
  return { lat, lng };
};

const CampusMap = () => {
  const [quests, setQuests] = useState<QuestMarker[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<QuestMarker | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const { theme } = useTheme(); // Add theme hook

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
  });

  // Fetch quests from Firebase
  useEffect(() => {
    const fetchQuests = async () => {
      const snapshot = await getDocs(collection(db, "quests"));
      const data: QuestMarker[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const { lat, lng } = parseCoordinates(d.building);

        return {
          id: doc.id,
          title: d.title,
          description: d.description,
          location: d.title,
          difficulty: d.difficulty || "Medium",
          points: d.rewardPoints,
          type: d.type || "Location",
          status: d.status === "active" ? "Available" : "Completed",
          position: { lat, lng },
        };
      });
      setQuests(data);
    };
    fetchQuests();
  }, []);

  // Get user position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, []);

  // When a quest is selected, get directions
  const handleQuestClick = (quest: QuestMarker) => {
    setSelectedQuest(quest);
    if (!userPosition) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userPosition,
        destination: quest.position,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === "OK" && result) setDirections(result);
        else console.error("Directions request failed:", status);
      }
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-success";
      case "Medium": return "bg-warning";
      case "Hard": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      {/* Header with theme toggle */}
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-card dark:bg-gray-800 shadow-card-custom dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  <span>NAVIGO Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoaded && (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={selectedQuest?.position || center}
                    zoom={17}
                  >
                    {userPosition && <Marker position={userPosition} label="You" />}
                    {quests.map((quest) => (
                      <Marker
                        key={quest.id}
                        position={quest.position}
                        onClick={() => handleQuestClick(quest)}
                      />
                    ))}
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quest Details */}
          <div className="space-y-6">
            {selectedQuest ? (
              <Card className="bg-card dark:bg-gray-800 shadow-quest dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{selectedQuest.title}</CardTitle>
                    <Badge className={getDifficultyColor(selectedQuest.difficulty)}>
                      {selectedQuest.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground dark:text-gray-300">{selectedQuest.description}</p>
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
                  <QuestTracker
                  questLocation={selectedQuest.position}
                  questId={selectedQuest.id}
                />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card dark:bg-gray-800 shadow-card-custom dark:border-gray-700">
                <CardContent className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground dark:text-gray-300">Click on a quest marker to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;