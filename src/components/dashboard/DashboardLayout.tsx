import React, { ReactNode, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { useToggle } from "@/hooks/common";
import { ROUTES, APP_CONFIG } from "@/lib/constants";
import { capitalizeFirst } from "@/lib/utils-extended";
import SyncStatus from "@/components/SyncStatus";
import ErrorBoundary from "@/components/common/ErrorBoundary";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  description?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { value: isMobileMenuOpen, toggle: toggleMobileMenu, setFalse: closeMobileMenu } = useToggle(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, profile } = useAuth();

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems: MenuItem[] = useMemo(() => [
    { 
      icon: <Home size={24} />, 
      label: "Dashboard", 
      path: ROUTES.DASHBOARD,
      description: "Overview and quick actions"
    },
    { 
      icon: <CalendarDays size={24} />, 
      label: "Workouts", 
      path: ROUTES.WORKOUTS,
      description: "Manage your workout routines"
    },
    { 
      icon: <Brain size={24} />, 
      label: "AI Workouts", 
      path: ROUTES.AI_WORKOUTS,
      description: "AI-generated workout plans"
    },
    { 
      icon: <Utensils size={24} />, 
      label: "Meal Plan", 
      path: ROUTES.MEAL_PLAN,
      description: "Nutrition and meal planning"
    },
    { 
      icon: <BarChart3 size={24} />, 
      label: "Progress", 
      path: ROUTES.PROGRESS,
      description: "Track your fitness journey"
    },
    { 
      icon: <Bell size={24} />, 
      label: "Reminders", 
      path: ROUTES.REMINDERS,
      description: "Manage notifications"
    },
    { 
      icon: <User size={24} />, 
      label: "Profile", 
      path: ROUTES.PROFILE,
      description: "Account settings and preferences"
    },
  ], []);

  // Memoize user initials calculation
  const userInitials = useMemo((): string => {
    if (!user) return "?";
    
    if (profile?.first_name || profile?.last_name) {
      const first = profile.first_name ? profile.first_name[0] : "";
      const last = profile.last_name ? profile.last_name[0] : "";
      return (first + last).toUpperCase();
    }
    
    return user.email ? user.email[0].toUpperCase() : "?";
  }, [user, profile]);

  // Memoize user display name
  const userDisplayName = useMemo((): string => {
    if (profile?.first_name) {
      return `${capitalizeFirst(profile.first_name)} ${profile?.last_name ? capitalizeFirst(profile.last_name) : ''}`.trim();
    }
    return user?.email || 'User';
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu(); // Close mobile menu after navigation
  };

  const isActivePath = (path: string): boolean => {
    return location.pathname === path;
  };

  // Memoize navigation item component to prevent re-renders
  const NavigationItem = React.memo(({ item, onClick, isActive }: { 
    item: MenuItem; 
    onClick: () => void; 
    isActive: boolean;
  }) => (
    <Button
      variant="ghost"
      className={`w-full justify-start py-6 transition-all duration-200 group ${
        isActive 
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500 shadow-lg' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-blue-50 dark:hover:from-orange-950/30 dark:hover:to-blue-950/30 hover:text-orange-700 dark:hover:text-orange-300 hover:shadow-md hover:border-r-2 hover:border-orange-300'
      }`}
      onClick={onClick}
      title={item.description}
    >
      <div className={`transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 ${
        isActive ? 'scale-110' : ''
      }`}>
        {item.icon}
      </div>
      <span className="ml-4 font-medium">{item.label}</span>
    </Button>
  ));

  NavigationItem.displayName = 'NavigationItem';

  return (
    <ErrorBoundary level="component">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:flex flex-col z-10">
                     {/* Header */}
           <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700">
            <h2 className="text-2xl font-bold text-white">{APP_CONFIG.NAME}</h2>
            <div className="flex items-center gap-2">
              <SyncStatus />
              <Avatar 
                className="h-8 w-8 bg-primary-foreground text-primary cursor-pointer" 
                title={userDisplayName}
              >
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="Main navigation">
            {menuItems.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                onClick={() => handleNavigation(item.path)}
                isActive={isActivePath(item.path)}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start py-6 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/30 dark:hover:to-orange-950/30 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md transition-all duration-200"
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
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={toggleMobileMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex flex-col h-full">
                                         {/* Mobile Header */}
                     <div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700">
                      <h2 className="text-xl font-bold text-white">{APP_CONFIG.NAME}</h2>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="Mobile navigation">
                      {menuItems.map((item) => (
                        <NavigationItem
                          key={item.path}
                          item={item}
                          onClick={() => handleNavigation(item.path)}
                          isActive={isActivePath(item.path)}
                        />
                      ))}
                    </nav>

                                         {/* Mobile Footer */}
                     <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                       <Button
                         variant="ghost"
                         className="w-full justify-start py-6 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/30 dark:hover:to-orange-950/30 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md transition-all duration-200"
                         onClick={handleLogout}
                       >
                         <LogOut />
                         <span className="ml-4">Logout</span>
                       </Button>
                     </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <SyncStatus />
              <Avatar 
                className="h-8 w-8 bg-primary-foreground text-primary cursor-pointer" 
                title={userDisplayName}
              >
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="md:ml-64 min-h-screen">
          <div className="p-6">
            {/* Desktop Page Title */}
            <div className="hidden md:block mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>

            {/* Page Content */}
            <ErrorBoundary level="page">
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(DashboardLayout);
