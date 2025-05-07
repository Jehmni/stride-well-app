
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DbFixesNoticeProps {
  hasIssues: boolean;
  issueType: "exercise-logging" | "ai-workouts" | "both";
  onFixClick?: () => void;
}

/**
 * A component that displays a notice when database fixes are needed
 */
const DbFixesNotice: React.FC<DbFixesNoticeProps> = ({ 
  hasIssues, 
  issueType,
  onFixClick
}) => {
  if (!hasIssues) {
    return (
      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 mb-4">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle>Database is properly configured</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Both exercise logging and AI workout features are ready to use.
        </AlertDescription>
      </Alert>
    );
  }

  const getMessageByType = () => {
    switch (issueType) {
      case "exercise-logging":
        return {
          title: "Exercise logging needs configuration",
          description: "The database functions for exercise logging need to be set up."
        };
      case "ai-workouts":
        return {
          title: "AI workout suggestions needs configuration",
          description: "The database tables for AI workout suggestions need to be set up."
        };
      case "both":
      default:
        return {
          title: "Database configuration needed",
          description: "Both exercise logging and AI workout features need database setup."
        };
    }
  };

  const message = getMessageByType();

  return (
    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900 mb-4">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <div className="mb-2">{message.description}</div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onFixClick}
          className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 border-amber-300 dark:border-amber-700"
        >
          Apply Database Fixes
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DbFixesNotice;
