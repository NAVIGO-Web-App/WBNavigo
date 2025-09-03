import { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock } from "lucide-react";
import Header from "@/components/Header";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase"; // Make sure Firebase is initialized

interface QuestMarker {
  id: string;
  title: string;
  description: string;
  location: string; // Human-readable location (quest title)
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  type: "Location" | "Treasure" | "Challenge";
  status: "Available" | "In Progress" | "Completed";
  position: { lat: number; lng: number };
}

const containerStyle = { width: "100%", height: "500px", borderRadius: "0.75rem" };
const center = { lat: -26.1915, lng: 28.0309 };

// Function to parse coordinates like "26.1865° S, 28.0336° E" to decimal lat/lng
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

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDGZlh6l1MFfoGpOh5ip1OxRjCiBd95_3Y",
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
          location: d.title, // Show quest title as readable location
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  <span>Campus Quest Map</span>
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
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-card shadow-card-custom">
                <CardContent className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Click on a quest marker to view details</p>
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