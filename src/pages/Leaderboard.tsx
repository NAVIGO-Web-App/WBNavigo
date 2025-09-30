import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, TrendingUp, Crown } from "lucide-react";
import Header from "@/components/Header";
import { useTheme } from "@/contexts/ThemeContext";

interface LeaderboardEntry {
  name: string;
  email: string;
  points: number;
  avatar?: string;
  questsCompleted?: number;
  badges?: number;
  trend?: "up" | "down" | "same";
  isCurrentUser?: boolean;
  rank?: number;
}

const Leaderboard = () => {
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [user] = useAuthState(auth); // get the logged-in user

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);
        const users = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);

        // Sort by points descending
        const sorted = users.sort((a, b) => b.points - a.points);

        // Assign ranks and check current user
        const ranked = sorted.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isCurrentUser: entry.email === user?.email,
        }));

        setLeaderboardData(ranked);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground dark:text-gray-400">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingUp className="w-4 h-4 text-destructive rotate-180" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const topThree = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white transition-colors duration-200">
      <Header />
      <div className="container mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">NAVIGO Leaderboard</h1>
          <p className="text-muted-foreground dark:text-gray-300">
            See how you rank against other campus explorers
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topThree.map(entry => (
            <Card
              key={entry.email}
              className={`relative overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                entry.rank === 1
                  ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-glow md:order-2 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-600"
                  : entry.rank === 2
                  ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 md:order-1 dark:from-gray-800/20 dark:to-gray-700/20 dark:border-gray-600"
                  : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 md:order-3 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-600"
              }`}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">{getRankIcon(entry.rank!)}</div>
                <Avatar className="w-16 h-16 mx-auto mb-4 ring-4 ring-primary/20 dark:ring-primary/30">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {entry.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg dark:text-white">{entry.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary dark:text-blue-400">{entry.points.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-400">points</div>
                {entry.isCurrentUser && (
                  <Badge variant="secondary" className="mt-2 text-xs dark:bg-gray-600 dark:text-gray-300">
                    You
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card className="bg-card dark:bg-gray-800 dark:border-gray-700 shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-white">
              <Trophy className="w-6 h-6 text-primary" />
              <span>Full Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {restOfLeaderboard.map(entry => (
                <div
                  key={entry.email}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    entry.isCurrentUser
                      ? "bg-primary/10 dark:bg-blue-900/20 border border-primary/20 dark:border-blue-700/30"
                      : "hover:bg-muted/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">{getRankIcon(entry.rank!)}</div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback className="text-sm bg-muted dark:bg-gray-600 dark:text-gray-300">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground dark:text-white">
                        {entry.name}
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs dark:bg-gray-600 dark:text-gray-300">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">{entry.points} points</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">{getTrendIcon(entry.trend)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
