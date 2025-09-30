import React, { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
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
import { Edit3, Trophy, Calendar, Star, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  inventory?: any[];
  collectibles?: Collectible[];
  streakDays?: number;
}

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

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        // Query Firestore by email
        const usersCol = collection(db, "users");
        const q = query(usersCol);
        const snapshot = await getDocs(q);

        // Find the document matching the logged-in email
        const userDoc = snapshot.docs.find((doc) => doc.data().email === user.email);

        if (!userDoc) {
          console.error("No user found with email:", user.email);
          setLoading(false);
          return;
        }

        const data = userDoc.data() as UserProfile;

        // Load collectibles subcollection
        const collectiblesCol = collection(db, "users", userDoc.id, "collectibles");
        const collectiblesSnap = await getDocs(
          query(collectiblesCol, orderBy("createdAt", "asc"))
        );
        const collectiblesData: Collectible[] = collectiblesSnap.docs.map((c) => ({
          id: c.id,
          ...(c.data() as Collectible),
        }));

        setProfile({ ...data, collectibles: collectiblesData });
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) return <div className="text-center py-20">Please log in to view your profile.</div>;
  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!profile) return <div className="text-center py-20">No profile found.</div>;

  const xpProgress = ((profile.points || 0) / 100) * 100; // example: 100 XP per level

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Profile Header */}
        <Card className="bg-card dark:bg-gray-800 shadow-card-custom">
          <CardContent className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {profile.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <Button variant="ghost" size="sm">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <Badge className="bg-primary text-primary-foreground">Level 1</Badge>
                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  Rank #-- 
                </Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Points</span>
                  <span>{profile.points}</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-gray-800">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
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

          {/* Inventory Tab */}
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

          {/* Activity Tab */}
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
