import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, MapPin, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorksSection = () => {
  const steps = [
    {
      step: 1,
      title: "Sign Up & Join",
      description: "Create your account and join the campus quest community. Choose your avatar and set your campus preferences.",
      icon: UserPlus,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      step: 2,
      title: "Choose Your Quest",
      description: "Browse available quests on the interactive campus map. Pick challenges that match your interests and skill level.",
      icon: MapPin,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      step: 3,
      title: "Complete & Earn",
      description: "Navigate to quest locations, complete challenges, and earn points, badges, and exclusive campus rewards.",
      icon: Trophy,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with NAVIGO in three simple steps and begin your
            campus adventure today
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <Card className="h-full bg-gradient-card border-border/50 shadow-card-custom group hover:shadow-quest transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${step.bgColor} flex items-center justify-center shadow-card-custom`}>
                      <Icon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <span className={`text-2xl font-bold ${step.color} mr-2`}>
                        {step.step}
                      </span>
                      <CardTitle className="text-xl font-semibold text-card-foreground">
                        {step.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-muted-foreground leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>

                {/* Arrow connector for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/signup">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              Start Your Quest Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;