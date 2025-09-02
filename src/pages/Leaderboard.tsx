import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star, TrendingUp, Crown } from "lucide-react";
import Header from "@/components/Header";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar?: string;
  points: number;
  questsCompleted: number;
  badges: number;
  trend: "up" | "down" | "same";
  isCurrentUser?: boolean;
}

const Leaderboard = () => {
  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 1,
      username: "QuestMaster2024",
      points: 2450,
      questsCompleted: 28,
      badges: 15,
      trend: "same",
    },
    {
      rank: 2,
      username: "CampusExplorer",
      points: 2380,
      questsCompleted: 26,
      badges: 14,
      trend: "up",
    },
    {
      rank: 3,
      username: "TreasureHunter",
      points: 2250,
      questsCompleted: 24,
      badges: 12,
      trend: "down",
    },
    {
      rank: 4,
      username: "AdventureSeeker",
      points: 2100,
      questsCompleted: 22,
      badges: 11,
      trend: "up",
    },
    {
      rank: 5,
      username: "QuestNinja",
      points: 1950,
      questsCompleted: 21,
      badges: 10,
      trend: "same",
    },
    {
      rank: 6,
      username: "CampusLegend",
      points: 1800,
      questsCompleted: 19,
      badges: 9,
      trend: "up",
    },
    {
      rank: 7,
      username: "ExploreMore",
      points: 1650,
      questsCompleted: 18,
      badges: 8,
      trend: "down",
    },
    {
      rank: 8,
      username: "QuestChampion",
      points: 1500,
      questsCompleted: 16,
      badges: 7,
      trend: "up",
    },
    {
      rank: 42,
      username: "You",
      points: 150,
      questsCompleted: 1,
      badges: 1,
      trend: "up",
      isCurrentUser: true,
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-yellow-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Campus Quest Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See how you rank against other campus explorers
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topThree.map((entry, index) => (
            <Card
              key={entry.rank}
              className={`relative overflow-hidden ${
                entry.rank === 1
                  ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-glow md:order-2"
                  : entry.rank === 2
                  ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 md:order-1"
                  : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 md:order-3"
              } transform hover:scale-105 transition-all duration-300`}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="w-16 h-16 mx-auto mb-4 ring-4 ring-primary/20">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{entry.username}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {entry.points.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">points</div>
                <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
                  <span>{entry.questsCompleted} quests</span>
                  <span>{entry.badges} badges</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard */}
        <Card className="bg-gradient-card shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-primary" />
              <span>Full Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {restOfLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    entry.isCurrentUser
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback className="text-sm bg-muted">
                        {entry.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {entry.username}
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.questsCompleted} quests • {entry.badges} badges
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">points</div>
                    </div>
                    {getTrendIcon(entry.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-gradient-card shadow-card-custom">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Star className="w-5 h-5 text-warning" />
                <span>Your Rank</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">#42</div>
              <div className="text-sm text-muted-foreground">out of 500+ players</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card-custom">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-success" />
                <span>Your Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">150</div>
              <div className="text-sm text-muted-foreground">Keep exploring to climb higher!</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card-custom">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Next Goal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">350</div>
              <div className="text-sm text-muted-foreground">points to reach rank #30</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;