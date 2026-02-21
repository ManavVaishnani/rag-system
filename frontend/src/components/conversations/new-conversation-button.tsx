import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NewConversationButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function NewConversationButton({
  onClick,
  isLoading = false,
  className,
}: NewConversationButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'w-full justify-start',
        'bg-accent/10 hover:bg-accent/20 text-accent',
        'border border-accent/20 hover:border-accent/40',
        'transition-all',
        className
      )}
      variant="ghost"
    >
      <Plus className="mr-2 h-4 w-4" />
      New Chat
    </Button>
  );
}
