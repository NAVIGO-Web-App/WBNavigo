import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Trophy, 
  Star, 
  MapPin, 
  Calendar, 
  Award, 
  Target, 
  TrendingUp,
  Edit3
} from "lucide-react";
import Header from "@/components/Header";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  unlockedAt: string;
}

interface Collectible {
  id: string;
  name: string;
  type: "Badge" | "Trophy" | "Artifact";
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  obtainedFrom: string;
}

const Profile = () => {
  const userStats = {
    username: "You",
    level: 3,
    currentXP: 150,
    nextLevelXP: 250,
    totalPoints: 150,
    rank: 42,
    questsCompleted: 1,
    totalQuests: 5,
    joinedDate: "January 2024",
    streakDays: 3,
  };

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first quest",
      icon: "🎯",
      rarity: "Common",
      unlockedAt: "2 days ago",
    },
    {
      id: "2",
      title: "Explorer",
      description: "Visit 5 different campus locations",
      icon: "🗺️",
      rarity: "Rare",
      unlockedAt: "1 day ago",
    },
    {
      id: "3",
      title: "Knowledge Seeker",
      description: "Complete a library quest",
      icon: "📚",
      rarity: "Common",
      unlockedAt: "2 days ago",
    },
  ];

  const collectibles: Collectible[] = [
    {
      id: "1",
      name: "Art Appreciation Badge",
      type: "Badge",
      description: "Awarded for completing the Art Gallery Quest",
      rarity: "Common",
      obtainedFrom: "Art Gallery Quest",
    },
    {
      id: "2",
      name: "Campus Newcomer",
      type: "Badge",
      description: "Welcome to Campus Quest!",
      rarity: "Common",
      obtainedFrom: "Registration",
    },
  ];

  const recentActivity = [
    {
      action: "Completed Art Gallery Quest",
      points: "+150 points",
      time: "2 days ago",
      icon: "🎨",
    },
    {
      action: "Started Cafeteria Treasure quest",
      points: "",
      time: "1 day ago",
      icon: "🍽️",
    },
    {
      action: "Joined Campus Quest",
      points: "+50 points",
      time: "3 days ago",
      icon: "🎉",
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "bg-muted text-muted-foreground";
      case "Rare": return "bg-primary text-primary-foreground";
      case "Epic": return "bg-secondary text-secondary-foreground";
      case "Legendary": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const progressPercentage = (userStats.currentXP / userStats.nextLevelXP) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="bg-gradient-card shadow-card-custom mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {userStats.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{userStats.username}</h1>
                  <Button variant="ghost" size="sm">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                  <Badge className="bg-primary text-primary-foreground">
                    Level {userStats.level}
                  </Badge>
                  <Badge variant="outline">
                    Rank #{userStats.rank}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Level Progress</span>
                    <span>{userStats.currentXP} / {userStats.nextLevelXP} XP</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-primary">{userStats.totalPoints}</div>
                    <div className="text-xs text-muted-foreground">Total Points</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-success">{userStats.questsCompleted}</div>
                    <div className="text-xs text-muted-foreground">Quests Done</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-secondary">{achievements.length}</div>
                    <div className="text-xs text-muted-foreground">Achievements</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-warning">{userStats.streakDays}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="bg-gradient-card shadow-card-custom hover:shadow-quest transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl">{achievement.icon}</div>
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Unlocked {achievement.unlockedAt}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Locked Achievement Example */}
              <Card className="bg-gradient-card shadow-card-custom opacity-60 border-dashed">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl opacity-50">🔒</div>
                    <Badge variant="outline">???</Badge>
                  </div>
                  <CardTitle className="text-lg text-muted-foreground">Mystery Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Complete more quests to unlock this achievement
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectibles.map((item) => (
                <Card key={item.id} className="bg-gradient-card shadow-card-custom">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <Award className="w-8 h-8 text-primary" />
                      <Badge className={getRarityColor(item.rarity)}>
                        {item.rarity}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {item.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Obtained from: {item.obtainedFrom}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty Inventory Slots */}
              <Card className="bg-gradient-card shadow-card-custom border-dashed opacity-60">
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Empty Slot</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-gradient-card shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">{activity.time}</div>
                      </div>
                      {activity.points && (
                        <Badge variant="outline" className="text-success border-success">
                          {activity.points}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="bg-gradient-card shadow-card-custom">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span>Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quests Completed</span>
                      <span className="font-medium">{userStats.questsCompleted}/{userStats.totalQuests}</span>
                    </div>
                    <Progress value={(userStats.questsCompleted / userStats.totalQuests) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card-custom">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-success" />
                    <span>Member Since</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-foreground">{userStats.joinedDate}</div>
                  <div className="text-sm text-muted-foreground">Campus Quest Explorer</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card-custom">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Star className="w-5 h-5 text-warning" />
                    <span>Next Milestone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-primary">Level 4</div>
                  <div className="text-sm text-muted-foreground">{userStats.nextLevelXP - userStats.currentXP} XP to go</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;