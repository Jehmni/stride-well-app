
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-fitness-primary to-fitness-secondary text-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">StrideWell</div>
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

        <div className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 animate-fade-in">
              Your Personalized Fitness Journey Begins Here
            </h1>
            <p className="text-xl mb-8 opacity-90 animate-slide-up">
              StrideWell creates customized workout and nutrition plans tailored to your body and goals.
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
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Personalized For Your Success</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fitness-primary">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Custom Workout Plans</h3>
              <p className="text-gray-600">
                Personalized workout routines based on your fitness level, goals, and available equipment.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-green-100 rounded-full inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fitness-secondary">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Nutrition Guidelines</h3>
              <p className="text-gray-600">
                Tailored meal plans and nutritional advice to fuel your workouts and reach your goals faster.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-3 bg-purple-100 rounded-full inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fitness-accent">
                  <path d="M2 12h20"></path>
                  <path d="M12 2v20"></path>
                  <path d="m4.93 4.93 14.14 14.14"></path>
                  <path d="m19.07 4.93-14.14 14.14"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your growth and achievements with visual charts and insightful analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-fitness-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600">Sign up and set up your profile in minutes</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-fitness-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Share Your Goals</h3>
              <p className="text-gray-600">Tell us what you want to achieve</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-fitness-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Get Your Plan</h3>
              <p className="text-gray-600">Receive customized workouts and meal plans</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-fitness-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor your journey and celebrate wins</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                text: "StrideWell helped me lose 15kg in 6 months with workouts I can actually stick to!",
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
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="h-12 w-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-fitness-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Fitness?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already achieved their fitness goals with StrideWell.
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
              <h3 className="text-xl font-bold mb-4 text-white">StrideWell</h3>
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
            <p>© 2025 StrideWell. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
