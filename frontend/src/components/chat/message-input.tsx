import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { PendingAttachment } from '@/types';

interface MessageInputProps {
  onSend: (content: string) => void;
  onAttachFiles?: () => void;
  attachments?: PendingAttachment[];
  onRemoveAttachment?: (id: string) => void;
  isUploading?: boolean;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onAttachFiles,
  attachments = [],
  onRemoveAttachment,
  isUploading = false,
  isStreaming = false,
  disabled = false,
  placeholder = "Type your message...",
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSend = () => {
    if (!content.trim() || disabled || isStreaming) return;
    onSend(content.trim());
    setContent('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasAttachments = attachments.length > 0;
  const isSendDisabled = disabled || isStreaming || (!content.trim() && !hasAttachments);

  return (
    <div className="border-t border-border bg-card p-4">
      {/* Attachments Preview */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              onRemove={onRemoveAttachment}
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        {onAttachFiles && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={onAttachFiles}
            disabled={isUploading || disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        )}

        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            className={cn(
              "min-h-[44px] max-h-[200px] resize-none pr-12",
              "bg-muted border-0 focus-visible:ring-1 focus-visible:ring-accent",
              "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
            )}
            rows={1}
          />
          
          {/* Send Button (inside textarea on larger screens) */}
          <Button
            size="icon"
            className={cn(
              "absolute right-2 bottom-1.5 h-8 w-8 shrink-0",
              "bg-accent hover:bg-accent/90 text-accent-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            onClick={handleSend}
            disabled={isSendDisabled}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>
          {isStreaming ? 'AI is thinking...' : 'Press Enter to send, Shift+Enter for new line'}
        </span>
        {isUploading && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading attachments...
          </span>
        )}
      </div>
    </div>
  );
}

interface AttachmentChipProps {
  attachment: PendingAttachment;
  onRemove?: (id: string) => void;
}

function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const getStatusColor = () => {
    switch (attachment.status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'uploading':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border",
        getStatusColor()
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate max-w-[150px]" title={attachment.file.name}>
        {attachment.file.name}
      </span>
      
      {attachment.status === 'uploading' && (
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-current transition-all duration-300"
            style={{ width: `${attachment.progress}%` }}
          />
        </div>
      )}
      
      {attachment.status === 'completed' && (
        <span className="text-green-500">✓</span>
      )}
      
      {attachment.status === 'error' && (
        <span className="text-red-500" title={attachment.error}>!</span>
      )}
      
      {onRemove && attachment.status !== 'uploading' && (
        <button
          onClick={() => onRemove(attachment.id)}
          className="hover:bg-muted/50 rounded p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
