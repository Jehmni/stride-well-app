import React from 'react';
import { Bot, Sparkles, BrainCircuit, ActivitySquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AIGeneratedNoticeProps {
  title?: string;
  isGenerating?: boolean;
  progress?: number;
  statusMessage?: string;
  type?: 'workout' | 'nutrition' | 'general';
}

/**
 * Component that shows a notice when content is AI-generated
 * Can also show generation in-progress with status updates
 */
const AIGeneratedNotice: React.FC<AIGeneratedNoticeProps> = ({ 
  title = "AI-Generated Workout Plan",
  isGenerating = false,
  progress = 0,
  statusMessage = "Our AI is designing a custom plan based on your goals and profile",
  type = 'workout'
}) => {
  // Choose icon based on content type
  const getIcon = () => {
    switch (type) {
      case 'workout':
        return isGenerating 
          ? <BrainCircuit className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          : <ActivitySquare className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />;
      case 'nutrition':
        return isGenerating
          ? <BrainCircuit className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400 animate-pulse" />  
          : <Sparkles className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />;
      default:
        return isGenerating
          ? <BrainCircuit className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          : <Sparkles className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />;
    }
  };
  
  const getBgColors = () => {
    switch (type) {
      case 'workout':
        return 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800';
      case 'nutrition':
        return 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800';
      default:
        return 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800';
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case 'workout':
        return {
          heading: 'text-indigo-700 dark:text-indigo-300',
          text: 'text-indigo-600/80 dark:text-indigo-400/80'
        };
      case 'nutrition':
        return {
          heading: 'text-emerald-700 dark:text-emerald-300',
          text: 'text-emerald-600/80 dark:text-emerald-400/80'
        };
      default:
        return {
          heading: 'text-indigo-700 dark:text-indigo-300',
          text: 'text-indigo-600/80 dark:text-indigo-400/80'
        };
    }
  };
  
  const textColors = getTextColor();
  
  return (
    <Card className={cn("mb-4 bg-gradient-to-r", getBgColors())}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center">
          {getIcon()}
          <div className="flex-grow">
            <h4 className={cn("text-sm font-medium", textColors.heading)}>
              {isGenerating ? "Creating your personalized plan..." : title}
            </h4>
            <p className={cn("text-xs", textColors.text)}>
              {isGenerating ? statusMessage : "This plan was intelligently created by AI based on your specific needs and goals"}
            </p>
          </div>
        </div>
          {isGenerating && progress > 0 && (
          <Progress 
            value={progress} 
            className={`h-1.5 mt-2 ${type === 'nutrition' ? "bg-emerald-100" : "bg-indigo-100"}`}
          />
        )}</CardContent>
    </Card>
  );
};

export default AIGeneratedNotice;
