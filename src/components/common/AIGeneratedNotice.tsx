import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIGeneratedNoticeProps {
  className?: string;
  showApi?: boolean;
}

const AIGeneratedNotice: React.FC<AIGeneratedNoticeProps> = ({
  className,
  showApi = false
}) => {
  return (
    <Alert 
      variant="default" 
      className={cn(
        "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800", 
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-500" />
        <span className="font-medium text-blue-500">AI Generated Content</span>
      </div>
      <AlertDescription className="mt-1 text-sm text-muted-foreground">
        {showApi ? (
          <>
            This workout was created using AI (OpenAI GPT) based on your profile and preferences. 
            The plan is designed to help you achieve your fitness goals and is customized to your specific needs.
          </>
        ) : (
          <>
            This workout was created using artificial intelligence based on your profile and preferences. 
            The exercises and schedule are personalized to help you achieve your fitness goals.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default AIGeneratedNotice;
