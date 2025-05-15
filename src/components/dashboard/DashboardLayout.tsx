import React, { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Home,
  LogOut,
  Menu,
  User,
  Utensils,
  X,
  Brain,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SyncStatus from "@/components/SyncStatus";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, profile } = useAuth();

  const menuItems = [
    { icon: <Home size={24} />, label: "Dashboard", path: "/dashboard" },
    { icon: <CalendarDays size={24} />, label: "Workouts", path: "/workouts" },
    { icon: <Brain size={24} />, label: "AI Workouts", path: "/ai-workouts" },
    { icon: <Utensils size={24} />, label: "Meal Plan", path: "/meal-plan" },
    { icon: <BarChart3 size={24} />, label: "Progress", path: "/progress" },
    { icon: <Bell size={24} />, label: "Reminders", path: "/reminders" },
    { icon: <User size={24} />, label: "Profile", path: "/profile" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getUserInitials = (): string => {
    if (!user) return "?";
    
    if (profile?.first_name || profile?.last_name) {
      const first = profile.first_name ? profile.first_name[0] : "";
      const last = profile.last_name ? profile.last_name[0] : "";
      return (first + last).toUpperCase();
    }
    
    return user.email ? user.email[0].toUpperCase() : "?";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:flex flex-col z-10">
        <div className="h-16 flex items-center justify-between px-6 bg-fitness-primary">
          <h2 className="text-2xl font-bold text-white">CorePilot</h2>
          <div className="flex items-center gap-2">
            <SyncStatus />
            <Avatar className="h-8 w-8 bg-primary-foreground text-primary">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start py-6 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="ml-4">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start py-6 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleLogout}
          >
            <LogOut />
            <span className="ml-4">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="h-16 px-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">CorePilot</h2>
          <div className="flex items-center space-x-2">
            <SyncStatus />
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-16 flex items-center justify-between px-6 bg-fitness-primary">
                  <h2 className="text-xl font-bold text-white">CorePilot</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white hover:bg-blue-600"
                  >
                    <X />
                  </Button>
                </div>
                <nav className="p-4 space-y-1">
                  {menuItems.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start py-6 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.icon}
                      <span className="ml-4">{item.label}</span>
                    </Button>
                  ))}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-6 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleLogout}
                    >
                      <LogOut />
                      <span className="ml-4">Logout</span>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h1>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
