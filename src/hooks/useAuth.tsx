import * as React from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { useLoadingState } from "@/hooks/common";
import { showErrorToast, showSuccessToast } from "@/lib/utils-extended";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants";

// Define types for the auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Database['public']['Tables']['user_profiles']['Row'] | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create the context with a more explicit null check approach
const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<Database['public']['Tables']['user_profiles']['Row'] | null>(null);
  const { isLoading, setLoading, setError } = useLoadingState(true);

  // Fetch user profile data with error handling
  const fetchProfile = React.useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setError(error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Unexpected error fetching user profile:", error);
      showErrorToast(error, "Failed to fetch user profile");
      return null;
    }
  }, [setError]);

  // Function to refresh the user profile data
  const refreshProfile = React.useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchProfile, setLoading]);

  // Handle auth state changes
  React.useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // When the user signs in or token is refreshed
        if (currentSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Defer the profile fetch to avoid recursive auth calls
          setTimeout(async () => {
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
            setLoading(false);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check current session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // If a user is signed in, fetch their profile
      if (currentSession?.user) {
        const profileData = await fetchProfile(currentSession.user.id);
        setProfile(profileData);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, setLoading]);

  const signOut = React.useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        showErrorToast(error, "Failed to sign out");
      } else {
        showSuccessToast("Successfully signed out");
      }
    } catch (error) {
      showErrorToast(error, "Failed to sign out");
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Create the auth context value
  const contextValue: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook with a proper null check
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
