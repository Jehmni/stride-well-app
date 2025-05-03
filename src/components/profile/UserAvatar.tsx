
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  showUploadButton?: boolean;
  onAvatarChange?: (url: string | null) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = "md", 
  showUploadButton = false,
  onAvatarChange
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Size classes mapping
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };
  
  // Get fallback initials for the avatar
  const getInitials = (): string => {
    const first = profile?.first_name?.charAt(0) || '';
    const last = profile?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  };
  
  // Load avatar URL on component mount
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);
  
  // Upload new profile picture
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      
      const file = event.target.files[0];
      setUploading(true);
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        setUploading(false);
        return;
      }
      
      // Only allow image files
      if (!file.type.startsWith('image/')) {
        toast.error("Only image files are allowed");
        setUploading(false);
        return;
      }
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      const avatarUrl = data.publicUrl;
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setAvatarUrl(avatarUrl);
      
      // Refresh profile data
      if (refreshProfile) {
        await refreshProfile();
      }
      
      // Notify parent component
      if (onAvatarChange) {
        onAvatarChange(avatarUrl);
      }
      
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700`}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="Profile" />
        ) : null}
        <AvatarFallback className="text-2xl font-bold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      {showUploadButton && (
        <div className="absolute bottom-0 right-0">
          <label 
            htmlFor="avatar-upload" 
            className="cursor-pointer bg-fitness-primary hover:bg-fitness-primary-dark text-white p-1.5 rounded-full flex items-center justify-center transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
