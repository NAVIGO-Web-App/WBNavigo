import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import locationIcon from "@/assets/location-quest-icon.png";
import treasureIcon from "@/assets/treasure-hunt-icon.png";
import collectiblesIcon from "@/assets/collectibles-icon.png";
import leaderboardIcon from "@/assets/leaderboard-icon.png";

const FeaturesSection = () => {
  const features = [
    {
      title: "Location Quests",
      description: "Explore campus landmarks and discover hidden spots through GPS-based challenges",
      icon: locationIcon,
      gradient: "from-primary to-primary-glow",
    },
    {
      title: "Treasure Hunts",
      description: "Follow clues and solve puzzles to find hidden treasures across campus",
      icon: treasureIcon,
      gradient: "from-warning to-secondary",
    },
    {
      title: "Collectibles",
      description: "Earn badges, achievements, and unique rewards for completing quests",
      icon: collectiblesIcon,
      gradient: "from-secondary to-warning",
    },
    {
      title: "Leaderboard",
      description: "Compete with friends and climb the rankings to become the campus champion",
      icon: leaderboardIcon,
      gradient: "from-success to-primary",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Campus Adventure Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover all the exciting ways to explore your campus and compete
            with fellow students
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group hover:shadow-quest transition-all duration-300 transform hover:scale-105 bg-gradient-card border-border/50"
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-card-custom`}
                >
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;