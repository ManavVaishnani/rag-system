import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttachmentButtonProps {
  onClick: () => void;
  isUploading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AttachmentButton({
  onClick,
  isUploading = false,
  disabled = false,
  className,
}: AttachmentButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'shrink-0 h-10 w-10 transition-colors',
        'hover:bg-accent/10 hover:text-accent',
        isUploading && 'text-accent animate-pulse',
        className
      )}
      onClick={onClick}
      disabled={isUploading || disabled}
      title="Attach files (PDF, DOCX, TXT, MD) — max 10 files, 10 MB each"
    >
      <Paperclip className="h-5 w-5" />
    </Button>
  );
}
