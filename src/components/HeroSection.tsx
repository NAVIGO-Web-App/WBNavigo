import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import campusHero from "@/assets/campus-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${campusHero})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-card-custom">
            <Play className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium text-card-foreground">
              Start Your Campus Adventure
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Discover Your Campus,{" "}
            <span className="bg-gradient-to-r from-secondary to-warning bg-clip-text text-transparent">
              One Quest at a Time
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Complete challenges, find hidden markers, earn rewards, and compete
            with friends on the leaderboard. Your campus adventure awaits!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            {/* <Link to="/quests">
              <Button
                variant="quest"
                size="lg"
                className="text-lg px-8 py-6 bg-card/90 backdrop-blur-sm"
              >
                View Quests
              </Button>
            </Link> */}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-foreground">
                50+
              </div>
              <div className="text-sm text-primary-foreground/80">Quests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-foreground">
                25+
              </div>
              <div className="text-sm text-primary-foreground/80">
                Locations
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-foreground">
                100+
              </div>
              <div className="text-sm text-primary-foreground/80">Rewards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quest Markers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-secondary rounded-full animate-bounce shadow-glow opacity-80" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-warning rounded-full animate-bounce delay-500 shadow-glow opacity-70" />
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-success rounded-full animate-bounce delay-1000 shadow-glow opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-primary-glow rounded-full animate-bounce delay-700 shadow-glow opacity-75" />
      </div>
    </section>
  );
};

export default HeroSection;