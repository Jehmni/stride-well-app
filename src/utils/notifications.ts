import { toast } from 'sonner';

// Enhanced toast functions with better visibility
export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 5000,
  });
};

export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 8000, // Longer duration for errors
  });
};

export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 6000,
  });
};

export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 5000,
  });
};

// Loading toast with better visibility
export const showLoading = (message: string) => {
  return toast.loading(message, {
    duration: Infinity, // Will be dismissed manually
  });
};

// Dismiss a specific toast
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

// Enhanced error messages for common scenarios
export const showNetworkError = () => {
  showError(
    "Connection Error",
    "Please check your internet connection and try again."
  );
};

export const showAuthError = (message?: string) => {
  showError(
    "Authentication Error",
    message || "Please log in again to continue."
  );
};

export const showWorkoutError = (message?: string) => {
  showError(
    "Workout Error",
    message || "There was an issue with your workout. Please try again."
  );
};

export const showProfileError = (message?: string) => {
  showError(
    "Profile Update Error",
    message || "Failed to update your profile. Please try again."
  );
};

export const showAIWorkoutError = (message?: string) => {
  showError(
    "AI Workout Generation Error",
    message || "Failed to generate your AI workout. Please try again."
  );
};

// Success messages
export const showWorkoutSuccess = (message?: string) => {
  showSuccess(
    "Workout Completed!",
    message || "Your progress has been saved successfully."
  );
};

export const showProfileSuccess = (message?: string) => {
  showSuccess(
    "Profile Updated!",
    message || "Your profile has been updated successfully."
  );
};

export const showAIWorkoutSuccess = (message?: string) => {
  showSuccess(
    "AI Workout Generated!",
    message || "Your personalized workout plan is ready."
  );
}; 