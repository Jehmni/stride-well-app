
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import AuthLayout from "./AuthLayout";

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // For demo purposes - would normally connect to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Account created!",
        description: "Your account has been successfully created.",
      });
      
      navigate("/onboarding");
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "An error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create Your Account" 
      subtitle="Sign up to start your fitness journey"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="mt-1">
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fitness-input"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="mt-1">
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fitness-input"
              placeholder="At least 8 characters"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <div className="mt-1">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="fitness-input"
              placeholder="Confirm your password"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full fitness-button-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              Or
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-fitness-primary hover:text-blue-700 font-medium"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignupForm;
