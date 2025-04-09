
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import AuthLayout from "./AuthLayout";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demo purposes - would normally connect to backend
      // Simulating authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo credentials check
      if (email === "demo@example.com" && password === "password") {
        localStorage.setItem("isAuthenticated", "true");
        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Try demo@example.com / password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Login to your StrideWell account"
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
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/reset-password" className="text-fitness-primary hover:text-blue-700 font-medium">
              Forgot your password?
            </Link>
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
                Logging in...
              </>
            ) : (
              <>
                Log in
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
            to="/signup"
            className="text-fitness-primary hover:text-blue-700 font-medium"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginForm;
