import { MessageSquare, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyChatStateProps {
  onStartChat?: () => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Summarize the key points from my documents",
  "What information do I have about...",
  "Compare and contrast the documents I've uploaded",
  "Extract important dates and deadlines",
];

export function EmptyChatState({ 
  onStartChat, 
  suggestions = DEFAULT_SUGGESTIONS 
}: EmptyChatStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-background text-foreground">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
          <Sparkles className="h-8 w-8 text-accent" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-3">
          How can I help you today?
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Ask me anything about your documents. I can summarize content, 
          answer questions, and help you find specific information.
        </p>

        {/* Suggestions */}
        <div className="grid gap-3 sm:grid-cols-2 mb-8">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              suggestion={suggestion}
              onClick={() => onStartChat?.()}
            />
          ))}
        </div>

        {/* Hint */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Upload documents to get started</span>
        </div>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: string;
  onClick?: () => void;
}

function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-xl border border-border bg-card",
        "hover:bg-accent/5 hover:border-accent/30",
        "transition-all duration-200 group"
      )}
    >
      <MessageSquare className="h-4 w-4 text-accent mb-2 group-hover:scale-110 transition-transform" />
      <p className="text-sm text-foreground">{suggestion}</p>
    </button>
  );
}
