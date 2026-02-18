import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, FileText, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { PendingAttachment } from '@/types';

interface MessageInputProps {
  onSend: (content: string) => void;
  onAttachFiles?: () => void;
  attachments?: PendingAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onRetryAttachment?: (id: string) => void;
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
  onRetryAttachment,
  isUploading = false,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask anything about your documents...",
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
  const hasErrors = attachments.some((a) => a.status === 'error');
  const isSendDisabled = disabled || isStreaming || isUploading || (!content.trim() && !hasAttachments) || hasErrors;

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
      {/* Attachments Preview */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/30 rounded-lg border border-border/50">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              onRemove={onRemoveAttachment}
              onRetry={onRetryAttachment}
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
            className={cn(
              "shrink-0 h-10 w-10 transition-colors",
              "hover:bg-accent/10 hover:text-accent",
              isUploading && "text-accent animate-pulse"
            )}
            onClick={onAttachFiles}
            disabled={isUploading || disabled}
            title="Attach files (PDF, DOCX, TXT, MD)"
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
              "bg-muted/50 border-border/50 focus-visible:ring-1 focus-visible:ring-accent",
              "placeholder:text-muted-foreground/50 transition-colors"
            )}
            rows={1}
          />
          
          {/* Send Button */}
          <Button
            size="icon"
            className={cn(
              "absolute right-2 bottom-1.5 h-8 w-8 shrink-0 transition-all",
              "bg-accent hover:bg-accent/90 text-accent-foreground",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              !isSendDisabled && "shadow-lg shadow-accent/20"
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
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground/70">
        <span>
          {isStreaming
            ? '✨ AI is thinking...'
            : hasErrors
            ? '⚠️ Fix upload errors before sending'
            : isUploading
            ? '⏳ Uploading files...'
            : 'Enter to send · Shift+Enter for new line · 📎 to attach files'}
        </span>
        {attachments.length > 0 && (
          <span className="text-xs">
            {attachments.filter((a) => a.status === 'completed').length}/{attachments.length} uploaded
          </span>
        )}
      </div>
    </div>
  );
}

interface AttachmentChipProps {
  attachment: PendingAttachment;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}

function AttachmentChip({ attachment, onRemove, onRetry }: AttachmentChipProps) {
  const getStatusStyles = () => {
    switch (attachment.status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'uploading':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-muted/80 text-muted-foreground border-border/50';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all",
        "max-w-[200px]",
        getStatusStyles()
      )}
      title={attachment.error || attachment.file.name}
    >
      {/* Icon */}
      {attachment.status === 'completed' ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      ) : attachment.status === 'error' ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
      ) : attachment.status === 'uploading' ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0" />
      )}

      {/* File info */}
      <div className="flex flex-col min-w-0">
        <span className="truncate max-w-[120px] font-medium leading-tight">
          {attachment.file.name}
        </span>
        {attachment.status === 'uploading' ? (
          <div className="w-full h-1 bg-current/20 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-current transition-all duration-300 rounded-full"
              style={{ width: `${attachment.progress}%` }}
            />
          </div>
        ) : (
          <span className="text-[10px] opacity-60 leading-tight">
            {attachment.status === 'error'
              ? 'Failed'
              : attachment.status === 'completed'
              ? 'Ready'
              : formatSize(attachment.file.size)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {attachment.status === 'error' && onRetry && (
          <button
            onClick={() => onRetry(attachment.id)}
            className="hover:bg-current/10 rounded p-0.5 transition-colors"
            title="Retry upload"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
        {attachment.status !== 'uploading' && onRemove && (
          <button
            onClick={() => onRemove(attachment.id)}
            className="hover:bg-current/10 rounded p-0.5 transition-colors"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
