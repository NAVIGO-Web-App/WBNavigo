import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, Navigation, Play, AlertCircle, HelpCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import { useQuest } from "@/contexts/QuestContext";
import ActiveQuestPanel from "@/components/ActiveQuestPanel";
import { Quest } from "@/types/quest";

// Define proper interfaces
interface Position {
  lat: number;
  lng: number;
}

const containerStyle = { width: "100%", height: "500px", borderRadius: "0.75rem" };
const center = { lat: -26.1915, lng: 28.0309 };

const CampusMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    quests, 
    userProgress, 
    loading, 
    activeQuest, 
    updateLastActivity, 
    completeLocationQuest,
    refreshQuests 
  } = useQuest();
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [userPosition, setUserPosition] = useState<Position | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [lastDirectionPosition, setLastDirectionPosition] = useState<Position | null>(null);
  const [positionUpdateCount, setPositionUpdateCount] = useState(0);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [isCalculatingDirections, setIsCalculatingDirections] = useState(false);
  const { theme } = useTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDGZlh6l1MFfoGpOh5ip1OxRjCiBd95_3Y",
    libraries: ["places", "geometry"]
  });

  // Initialize directions service once Google Maps is loaded
  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, [isLoaded]);

  // Memoized significant movement checker
  const isSignificantMovement = useCallback((newPosition: Position, lastPosition: Position | null): boolean => {
    if (!lastPosition) return true;
    
    const R = 6371000; // Earth's radius in meters
    const dLat = (newPosition.lat - lastPosition.lat) * Math.PI / 180;
    const dLon = (newPosition.lng - lastPosition.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lastPosition.lat * Math.PI / 180) * Math.cos(newPosition.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance > 10; // Only recalculate if moved more than 10 meters
  }, []);

  // Distance calculation function
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Calculate directions for ALL quest types (including quiz quests)
  const calculateDirections = useCallback(async (quest: Quest) => {
    if (!userPosition) {
      console.log("User position not available for directions");
      return;
    }

    if (!directionsServiceRef.current) {
      console.error("Directions service not available yet");
      setDirectionsError("Maps service not ready. Please wait...");
      return;
    }

    setDirectionsError(null);
    setIsCalculatingDirections(true);

    console.log("Calculating directions to:", quest.title, "at:", quest.position);

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        if (!directionsServiceRef.current) {
          reject(new Error("Directions service not available"));
          return;
        }

        directionsServiceRef.current.route(
          {
            origin: userPosition,
            destination: quest.position,
            travelMode: google.maps.TravelMode.WALKING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      setDirections(result);
      setLastDirectionPosition(userPosition);
      console.log("Directions calculated successfully");
      
    } catch (error) {
      console.error("Directions calculation error:", error);
      setDirectionsError(error instanceof Error ? error.message : "Failed to calculate directions");
      setDirections(null);
    } finally {
      setIsCalculatingDirections(false);
    }
  }, [userPosition]);

  // Get user position with significant movement detection
  useEffect(() => {
    let watchId: number;
    let mounted = true;

    if (navigator.geolocation && mounted) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!mounted) return;
          
          const newPosition: Position = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          };
          
          if (isSignificantMovement(newPosition, userPosition)) {
            setUserPosition(newPosition);
            updateLastActivity();
            console.log("Significant position update:", newPosition);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setDirectionsError("Unable to get your current location");
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }

    return () => {
      mounted = false;
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLastActivity, isSignificantMovement, userPosition]);

  // Handle quest auto-selection from navigation state or active quest
  useEffect(() => {
    if (quests.length > 0) {
      let questToSelect = null;
      const autoSelectQuestId = location.state?.autoSelectQuest;
      const activeQuestId = activeQuest?.questId;

      if (autoSelectQuestId || activeQuestId) {
        if (autoSelectQuestId) {
          questToSelect = quests.find((q: Quest) => q.id === autoSelectQuestId);
          window.history.replaceState({}, document.title);
        } else if (activeQuestId) {
          questToSelect = quests.find((q: Quest) => q.id === activeQuestId);
        }

        if (questToSelect && questToSelect.id !== selectedQuest?.id) {
          setSelectedQuest(questToSelect);
          console.log("Auto-selected quest:", questToSelect.title);
        }
      }
    }
  }, [location.state?.autoSelectQuest, activeQuest?.questId, quests, selectedQuest?.id]);

  // Auto-center map on selected quest
  useEffect(() => {
    if (selectedQuest && isLoaded && mapRef.current) {
      mapRef.current.panTo(selectedQuest.position);
      mapRef.current.setZoom(17);
    }
  }, [selectedQuest, isLoaded]);

  // Calculate directions only on significant changes
  useEffect(() => {
    if (!isLoaded || !directionsServiceRef.current) return;

    if (positionUpdateCount === 0 && userPosition) {
      setPositionUpdateCount(1);
      return;
    }

    if (selectedQuest && userPosition) {
      if (!lastDirectionPosition || isSignificantMovement(userPosition, lastDirectionPosition)) {
        setDirections(null);
        calculateDirections(selectedQuest);
      }
    } else {
      setDirections(null);
      setLastDirectionPosition(null);
      setDirectionsError(null);
    }
  }, [selectedQuest, userPosition, lastDirectionPosition, isSignificantMovement, calculateDirections, positionUpdateCount, isLoaded]);

  // Handle quest completion with quiz support
  useEffect(() => {
    if (!userPosition || !activeQuest) return;

    const activeQuestData = quests.find(q => q.id === activeQuest.questId);
    if (!activeQuestData) return;

    // Complete ALL quest types when user reaches location (including quiz quests)
    if (activeQuestData.type === "Location" || activeQuestData.type === "Quiz") {
      if (userProgress.completedQuests.includes(activeQuest.questId)) return;

      const isAtLocation = completeLocationQuest(activeQuest.questId, userPosition);
      
      if (isAtLocation) {
        console.log(`🎉 Success! Reached quest location: ${activeQuestData.title}`);
        
        // Special handling for quiz quests
        if (activeQuestData.type === "Quiz") {
          alert(`🎉 Location Reached! Now you can take the quiz for "${activeQuestData.title}"`);
          // Auto-navigate to quiz after reaching location
          navigate(`/quests/${activeQuestData.id}`);
        } else {
          alert(`🎉 Quest Completed! You've reached ${activeQuestData.title}`);
        }
        
        refreshQuests();
      }
    }
  }, [userPosition, activeQuest, quests, completeLocationQuest, refreshQuests, userProgress.completedQuests, navigate]);

  // Start quest function with quiz handling
  const handleStartQuest = useCallback(async (quest: Quest) => {
    if (!quest) return;

    // For quiz quests, user must reach location first
    if (quest.type === "Quiz") {
      if (userPosition) {
        const distance = calculateDistance(
          userPosition.lat, userPosition.lng,
          quest.position.lat, quest.position.lng
        );
        
        if (distance <= 50) {
          // User is at location, navigate to quiz
          navigate(`/quests/${quest.id}`);
        } else {
          // User needs to go to location first
          alert(`📍 First, navigate to the location to unlock this quiz!`);
          setSelectedQuest(quest);
          calculateDirections(quest);
        }
      } else {
        alert("📍 Waiting for your location... Please enable location services.");
      }
    } else {
      // For other quest types, use existing logic
      navigate(`/quest/${quest.id}`);
    }
  }, [userPosition, navigate, calculateDirections, calculateDistance]);

  // Continue quest function
  const handleContinueQuest = useCallback((quest: Quest) => {
    if (quest.type === "Quiz") {
      // For quiz quests, check if user is at location
      if (userPosition) {
        const distance = calculateDistance(
          userPosition.lat, userPosition.lng,
          quest.position.lat, quest.position.lng
        );
        
        if (distance <= 50) {
          navigate(`/quests/${quest.id}`);
        } else {
          alert(`📍 Return to the location to continue the quiz!`);
          setSelectedQuest(quest);
          calculateDirections(quest);
        }
      }
    } else {
      navigate(`/quest/${quest.id}`);
    }
  }, [userPosition, navigate, calculateDirections, calculateDistance]);

  const handleQuestClick = useCallback((quest: Quest) => {
    setSelectedQuest(quest);
    updateLastActivity();
    setDirectionsError(null);
  }, [updateLastActivity]);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500";
      case "Medium": return "bg-yellow-500";
      case "Hard": return "bg-red-500";
      default: return "bg-gray-500";
    }
  }, []);

  const retryDirections = useCallback(() => {
    if (selectedQuest) {
      calculateDirections(selectedQuest);
    }
  }, [selectedQuest, calculateDirections]);

  const isQuestInProgress = selectedQuest ? userProgress.inProgressQuests[selectedQuest.id] : false;
  const isQuestCompleted = selectedQuest ? userProgress.completedQuests.includes(selectedQuest.id) : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading quests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Google Maps...</p>
              {loadError && (
                <p className="text-destructive mt-2">Error loading maps: {loadError.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-card dark:bg-gray-800 shadow-card-custom dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-6 h-6 text-primary" />
                    <span>NAVIGO Map</span>
                  </div>
                  {selectedQuest && (
                    <Badge variant="secondary" className="flex items-center space-x-1 bg-primary text-primary-foreground">
                      <Navigation className="w-3 h-3" />
                      <span>Active: {selectedQuest.title}</span>
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={selectedQuest?.position || userPosition || center}
                  zoom={selectedQuest ? 17 : 15}
                  onLoad={(map) => {
                    mapRef.current = map;
                  }}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                  }}
                >
                  {/* User position */}
                  {userPosition && (
                    <Marker 
                      position={userPosition} 
                      label="📍"
                      title="Your current location"
                      icon={{
                        url: "data:image/svg+xml;base64," + btoa(`
                          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                            <circle cx="16" cy="16" r="4" fill="#FFFFFF"/>
                          </svg>
                        `),
                        scaledSize: new google.maps.Size(32, 32),
                      }}
                    />
                  )}

                  {/* Quest markers */}
                  {quests.map((quest: Quest) => {
                    const isSelected = selectedQuest?.id === quest.id;
                    const isCompleted = userProgress.completedQuests.includes(quest.id);
                    const isInProgress = userProgress.inProgressQuests[quest.id];
                    
                    return (
                      <Marker
                        key={quest.id}
                        position={quest.position}
                        onClick={() => handleQuestClick(quest)}
                        title={quest.title}
                        icon={isSelected ? {
                          url: "data:image/svg+xml;base64," + btoa(`
                            <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="18" cy="18" r="16" fill="#10B981" stroke="#FFFFFF" stroke-width="3"/>
                              <circle cx="18" cy="18" r="8" fill="#FFFFFF"/>
                            </svg>
                          `),
                          scaledSize: new google.maps.Size(36, 36),
                        } : isCompleted ? {
                          url: "data:image/svg+xml;base64," + btoa(`
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="14" fill="#22C55E" stroke="#FFFFFF" stroke-width="2"/>
                              <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
                            </svg>
                          `),
                          scaledSize: new google.maps.Size(32, 32),
                        } : isInProgress ? {
                          url: "data:image/svg+xml;base64," + btoa(`
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                              <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
                            </svg>
                          `),
                          scaledSize: new google.maps.Size(32, 32),
                        } : {
                          url: "data:image/svg+xml;base64," + btoa(`
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
                              <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
                            </svg>
                          `),
                          scaledSize: new google.maps.Size(32, 32),
                        }}
                        zIndex={isSelected ? 1000 : 500}
                      />
                    );
                  })}

                  {/* Directions to selected quest */}
                  {directions && selectedQuest && (
                    <DirectionsRenderer directions={directions} />
                  )}
                </GoogleMap>
              </CardContent>
            </Card>
          </div>

          {/* Quest Details */}
          <div className="space-y-6">
            <ActiveQuestPanel />
            
            {selectedQuest ? (
              <Card className="bg-card dark:bg-gray-800 shadow-quest dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{selectedQuest.title}</CardTitle>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getDifficultyColor(selectedQuest.difficulty)}>
                        {selectedQuest.difficulty}
                      </Badge>
                      <Badge variant="outline" className={
                        isQuestCompleted ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        isQuestInProgress ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }>
                        {isQuestCompleted ? "Completed" : isQuestInProgress ? "In Progress" : "Available"}
                      </Badge>
                      {/* Quest type badge */}
                      <Badge variant="secondary" className={
                        selectedQuest.type === "Quiz" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                        selectedQuest.type === "Location" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }>
                        {selectedQuest.type}
                      </Badge>
                    </div>
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
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{selectedQuest.rewardPoints || selectedQuest.points || 0} points</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Estimated: {selectedQuest.estimatedTime}</span>
                    </div>
                    
                    {/* Quiz-specific information */}
                    {selectedQuest.type === "Quiz" && (
                      <>
                        <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                          <HelpCircle className="w-4 h-4" />
                          <span>{selectedQuest.questions?.length || 0} questions</span>
                        </div>
                        {selectedQuest.passingScore && (
                          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                            <span>Passing: {selectedQuest.passingScore}%</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Directions for ALL quest types */}
                  <div className="pt-4 border-t border-border dark:border-gray-600">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-primary" />
                      <span>Directions to Location</span>
                      {isCalculatingDirections && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                      )}
                    </h4>
                    
                    {directionsError ? (
                      <div className="text-sm space-y-2">
                        <div className="flex items-center space-x-2 text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>Failed to load directions</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={retryDirections}
                          disabled={isCalculatingDirections}
                        >
                          {isCalculatingDirections ? "Retrying..." : "Retry Directions"}
                        </Button>
                      </div>
                    ) : directions && directions.routes[0]?.legs[0] ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Distance: {directions.routes[0].legs[0].distance?.text}</p>
                        <p>Time: {directions.routes[0].legs[0].duration?.text}</p>
                        {/* Quiz quest instructions */}
                        {selectedQuest.type === "Quiz" && (
                          <p className="text-purple-600 dark:text-purple-400 font-medium mt-2">
                            📍 Go to this location first to unlock the quiz!
                          </p>
                        )}
                      </div>
                    ) : isCalculatingDirections ? (
                      <p className="text-sm text-muted-foreground">Calculating directions...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Directions will appear here</p>
                    )}
                  </div>

                  {/* Quest action button */}
                  <Button 
                    onClick={isQuestInProgress ? () => handleContinueQuest(selectedQuest) : () => handleStartQuest(selectedQuest)} 
                    className="w-full"
                    disabled={isQuestCompleted}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isQuestCompleted ? "Completed" : 
                     selectedQuest.type === "Quiz" ? 
                       (isQuestInProgress ? "Continue Quiz" : "Navigate to Quiz Location") :
                     isQuestInProgress ? "Continue Quest" : "Start Quest"}
                  </Button>

                  {/* Quiz quest explanation */}
                  {selectedQuest.type === "Quiz" && !isQuestCompleted && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-800 dark:text-purple-300 text-center">
                        🎯 <strong>How this works:</strong><br/>
                        1. Navigate to the location shown on map<br/>
                        2. Quiz will automatically unlock when you arrive<br/>
                        3. Complete the quiz to earn {selectedQuest.rewardPoints || selectedQuest.points || 0} points!
                      </p>
                    </div>
                  )}

                  {/* Manual test button for location completion */}
                  {selectedQuest && selectedQuest.type === "Location" && !userProgress.completedQuests.includes(selectedQuest.id) && (
                    <Button 
                      onClick={() => {
                        if (selectedQuest && userPosition) {
                          const distance = calculateDistance(
                            userPosition.lat, userPosition.lng,
                            selectedQuest.position.lat, selectedQuest.position.lng
                          );
                          console.log(`🧪 Manual test - Distance: ${distance.toFixed(2)}m`);
                          
                          const completed = completeLocationQuest(selectedQuest.id, userPosition);
                          if (completed) {
                            console.log("✅ Manual completion successful!");
                            refreshQuests();
                          } else {
                            console.log("❌ Manual completion failed - not close enough");
                          }
                        }
                      }}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      🧪 Test Location Completion
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card dark:bg-gray-800 shadow-card-custom dark:border-gray-700">
                <CardContent className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground dark:text-gray-300">
                    {quests.length > 0 
                      ? "Click on a quest marker to view details" 
                      : "No quests available"
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Available Quests List */}
            {quests.length > 0 && (
              <Card className="bg-card dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-md">Available Quests ({quests.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {quests.map((quest: Quest) => (
                    <div 
                      key={quest.id}
                      className={`flex items-center p-3 rounded cursor-pointer ${
                        quest.id === selectedQuest?.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleQuestClick(quest)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{quest.title}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getDifficultyColor(quest.difficulty) + " text-xs"}>
                            {quest.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{quest.rewardPoints || quest.points || 0} pts</span>
                          {quest.type === "Quiz" && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Quiz
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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