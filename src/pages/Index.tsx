
import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/home/HeroSection";
import FeatureCard from "@/components/home/FeatureCard";
import TestimonialCard from "@/components/home/TestimonialCard";
import StepIndicator from "@/components/home/StepIndicator";

const Index: React.FC = () => {
  // Features data
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fitness-primary">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
          <path d="M2 12h20"></path>
        </svg>
      ),
      title: "Custom Workout Plans",
      description: "Personalized workout routines based on your fitness level, goals, and available equipment.",
      bgClass: "bg-blue-100"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fitness-secondary">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      ),
      title: "Nutrition Guidelines",
      description: "Tailored meal plans and nutritional advice to fuel your workouts and reach your goals faster.",
      bgClass: "bg-green-100"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fitness-accent">
          <path d="M2 12h20"></path>
          <path d="M12 2v20"></path>
          <path d="m4.93 4.93 14.14 14.14"></path>
          <path d="m19.07 4.93-14.14 14.14"></path>
        </svg>
      ),
      title: "Progress Tracking",
      description: "Monitor your growth and achievements with visual charts and insightful analytics.",
      bgClass: "bg-purple-100"
    }
  ];

  // Steps data
  const steps = [
    { step: 1, title: "Create Account", description: "Sign up and set up your profile in minutes" },
    { step: 2, title: "Share Your Goals", description: "Tell us what you want to achieve" },
    { step: 3, title: "Get Your Plan", description: "Receive customized workouts and meal plans" },
    { step: 4, title: "Track Progress", description: "Monitor your journey and celebrate wins" }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah M.",
      text: "CorePilot helped me lose 15kg in 6 months with workouts I can actually stick to!",
      image: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      name: "Mike T.",
      text: "The personalized meal plans made all the difference in my muscle gain journey.",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "Lisa K.",
      text: "As a busy mom, I love that the app adapts to my schedule and available equipment.",
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-fitness-primary to-fitness-secondary text-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">CorePilot</div>
          <div className="hidden md:flex space-x-4 items-center">
            <Link to="/login" className="text-white hover:text-gray-200 transition-colors">
              Login
            </Link>
            <Button asChild className="bg-white text-fitness-primary hover:bg-gray-100">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Button asChild className="bg-white text-fitness-primary hover:bg-gray-100">
              <Link to="/signup">Join</Link>
            </Button>
          </div>
        </nav>

        <HeroSection />
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Personalized For Your Success</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                bgClass={feature.bgClass}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <StepIndicator 
                key={index}
                step={step.step}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                text={testimonial.text}
                image={testimonial.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-fitness-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Fitness?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already achieved their fitness goals with CorePilot.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild size="lg" className="bg-white text-fitness-primary hover:bg-gray-100">
              <Link to="/signup">
                Get Started for Free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link to="/login">
                Login to Your Account
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">CorePilot</h3>
              <p className="mb-4">Your personalized fitness journey.</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Workout Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Nutrition Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Progress Tracking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Workout Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Nutrition Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p>© 2025 CorePilot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
