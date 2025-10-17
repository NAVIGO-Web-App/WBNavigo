import React, { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Edit3, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface Collectible {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  createdAt?: any;
}

interface UserProfile {
  name: string;
  email: string;
  points: number;
  profilePictureUrl?: string;
  inventory?: any[];
  collectibles?: Collectible[];
  streakDays?: number;
  rank?: number;
  level?: number;
}

// Level based on points
const computeLevel = (points: number) => Math.floor(points / 100) + 1;

// Milestone points
const milestones = [200, 500, 1000, 2000, 5000];

const getMilestoneColor = (points: number) => {
  if (points >= 5000) return "bg-yellow-500 text-black";
  if (points >= 2000) return "bg-purple-500 text-white";
  if (points >= 1000) return "bg-blue-500 text-white";
  if (points >= 500) return "bg-green-500 text-white";
  if (points >= 200) return "bg-indigo-500 text-white";
  return "bg-primary text-primary-foreground";
};

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case "common":
      return "bg-slate-500 text-white";
    case "rare":
      return "bg-blue-500 text-white";
    case "epic":
      return "bg-purple-500 text-white";
    case "legendary":
      return "bg-yellow-500 text-black";
    default:
      return "bg-slate-500 text-white";
  }
};

const Profile = () => {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userDocId, setUserDocId] = useState<string | null>(null);
  const [milestoneHit, setMilestoneHit] = useState(false);

  // For editing username
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);

        const userDoc = snapshot.docs.find((doc) => doc.data().email === user.email);
        if (!userDoc) {
          console.error("No user found with email:", user.email);
          setLoading(false);
          return;
        }

        setUserDocId(userDoc.id);
        const data = userDoc.data() as UserProfile;

        // Collectibles query
        const collectiblesCol = collection(db, "users", userDoc.id, "collectibles");
        const collectiblesQuery = query(collectiblesCol, orderBy("createdAt", "asc"));
        const collectiblesSnap = await getDocs(collectiblesQuery);

        const collectiblesData: Collectible[] = collectiblesSnap.docs.map((c) => ({
          id: c.id,
          ...(c.data() as Collectible),
        }));

        // Compute rank based on points
        const allUsers = snapshot.docs.map((doc) => doc.data() as UserProfile);
        const sorted = allUsers.sort((a, b) => b.points - a.points);
        const rank = sorted.findIndex((u) => u.email === user.email) + 1;

        // Compute level
        const level = computeLevel(data.points || 0);

        // Milestone check
        if (milestones.includes(data.points)) setMilestoneHit(true);

        setProfile({ ...data, collectibles: collectiblesData, rank, level });
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleProfilePictureUpload = async (file: File) => {
    if (!userDocId || !profile) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        const userDocRef = doc(db, "users", userDocId);
        await updateDoc(userDocRef, { profilePictureUrl: base64String });

        setProfile({ ...profile, profilePictureUrl: base64String });
        setShowUploadModal(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading profile picture:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProfilePictureUpload(file);
  };

  // Save new username
  const handleSaveName = async () => {
    if (!userDocId || !newName.trim()) return;

    try {
      const userDocRef = doc(db, "users", userDocId);
      await updateDoc(userDocRef, { name: newName.trim() });

      setProfile({ ...profile!, name: newName.trim() });
      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating name:", err);
    }
  };

  if (!user) return <div className="text-center py-20">Please log in to view your profile.</div>;
  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!profile) return <div className="text-center py-20">No profile found.</div>;

  const xpProgress = (profile.points || 0) % 100;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Profile Header */}
        <Card className="bg-card dark:bg-gray-800 shadow-card-custom">
          <CardContent className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 pt-6">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                <AvatarImage src={profile.profilePictureUrl} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setShowUploadModal(true)}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              {/* Editable Name */}
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                {isEditingName ? (
                  <>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-black dark:text-white"
                    />
                    <Button size="sm" onClick={handleSaveName}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setNewName(profile.name);
                      setIsEditingName(true);
                    }}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Level & Rank */}
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <Badge
                  className={clsx("transition-all duration-500", getMilestoneColor(profile.points), {
                    "animate-pulse": milestoneHit,
                  })}
                >
                  Level {profile.level}
                </Badge>
                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  Rank #{profile.rank}
                </Badge>
              </div>

              {/* XP Progress */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Points</span>
                  <span>{profile.points}</span>
                </div>
                <Progress
                  value={xpProgress}
                  max={100}
                  className={clsx("h-2 transition-colors duration-500", {
                    "bg-yellow-400 dark:bg-yellow-500": milestoneHit,
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm bg-card dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle>Upload Profile Picture</CardTitle>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-muted-foreground rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG or GIF (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-gray-800">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.collectibles?.map((a) => (
                <Card key={a.id} className="bg-card dark:bg-gray-800 shadow-card-custom">
                  <CardHeader className="pb-4 flex justify-between items-start">
                    <div className="text-3xl">🏆</div>
                    <Badge className={getRarityColor(a.rarity)}>{a.rarity}</Badge>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg dark:text-white">{a.name}</CardTitle>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">{a.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.inventory?.map((item, idx) => (
                <Card key={idx} className="bg-card dark:bg-gray-800 shadow-card-custom text-center">
                  <CardContent>
                    <img src={item.iconUrl} alt={item.name} className="w-8 h-8 mx-auto mb-2" />
                    <CardTitle className="text-lg dark:text-white">{item.name}</CardTitle>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-4">
              <div className="text-muted-foreground dark:text-gray-400 text-center">No recent activity yet.</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
