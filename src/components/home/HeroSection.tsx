
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 animate-fade-in">
          Your Personalized Fitness Journey Begins Here
        </h1>
        <p className="text-xl mb-8 opacity-90 animate-slide-up">
          CorePilot creates customized workout and nutrition plans tailored to your body and goals.
        </p>
        <Button asChild size="lg" className="bg-white text-fitness-primary hover:bg-gray-100 animate-slide-up">
          <Link to="/signup">
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
      <div className="md:w-1/2 animate-fade-in">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
          alt="Fitness" 
          className="rounded-lg shadow-xl"
        />
      </div>
    </div>
  );
};

export default HeroSection;
