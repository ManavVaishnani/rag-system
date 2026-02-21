import { FileText, CheckCircle2, AlertCircle, Loader2, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PendingAttachment } from '@/types';

interface FilePreviewChipsProps {
  attachments: PendingAttachment[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export function FilePreviewChips({
  attachments,
  onRemove,
  onRetry,
  className,
}: FilePreviewChipsProps) {
  if (attachments.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border border-border/50',
        className
      )}
    >
      {attachments.map((attachment) => (
        <FileChip
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

interface FileChipProps {
  attachment: PendingAttachment;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}

function FileChip({ attachment, onRemove, onRetry }: FileChipProps) {
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
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
        'max-w-[200px]',
        getStatusStyles()
      )}
      title={attachment.error || attachment.file.name}
    >
      {/* Status icon */}
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

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {attachment.status === 'error' && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(attachment.id)}
            className="hover:bg-current/10 rounded p-0.5 transition-colors"
            title="Retry upload"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
        {attachment.status !== 'uploading' && onRemove && (
          <button
            type="button"
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
