import React from 'react';
import { Bot, Sparkles, BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AIGeneratedNoticeProps {
  title?: string;
  isGenerating?: boolean;
}

/**
 * Component that shows a notice when content is AI-generated
 */
const AIGeneratedNotice: React.FC<AIGeneratedNoticeProps> = ({ 
  title = "AI-Generated Workout Plan",
  isGenerating = false
}) => {
  return (
    <Card className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
      <CardContent className="py-3 px-4 flex items-center">
        {isGenerating ? (
          <>
            <BrainCircuit className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <div>
              <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Creating your personalized workout...
              </h4>
              <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">
                Our AI is designing a custom workout plan based on your goals and profile
              </p>
            </div>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {title}
              </h4>
              <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">
                This workout plan was intelligently created by AI based on your specific needs and goals
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIGeneratedNotice;
