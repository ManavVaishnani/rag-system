import { FileText, File, FileCode, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Document } from '@/types/document.types';

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('text')) return FileCode;
  return File;
};

// Get file extension from mime type or filename
const getFileExtension = (mimeType: string, filename: string) => {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
  if (mimeType === 'text/plain') return 'TXT';
  if (mimeType === 'text/markdown') return 'MD';

  // Fallback to file extension
  const ext = filename.split('.').pop()?.toUpperCase();
  return ext || 'FILE';
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentCard({ document, onDelete, onView }: DocumentCardProps) {
  const FileIcon = getFileIcon(document.mimeType);
  const extension = getFileExtension(document.mimeType, document.originalName);

  // Status styling
  const statusConfig = {
    PROCESSING: {
      icon: Loader2,
      label: 'Processing',
      className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      iconClassName: 'animate-spin',
    },
    COMPLETED: {
      icon: CheckCircle,
      label: 'Ready',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
      iconClassName: '',
    },
    FAILED: {
      icon: AlertCircle,
      label: 'Failed',
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
      iconClassName: '',
    },
  };

  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  return (
    <Card className="group relative overflow-hidden hover:ring-1 hover:ring-accent/50 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
              <FileIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-medium text-sm text-foreground truncate"
                title={document.originalName}
              >
                {document.originalName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {extension}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(document.size)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn("flex items-center gap-1 text-xs", status.className)}
          >
            <StatusIcon className={cn("h-3 w-3", status.iconClassName)} />
            {status.label}
          </Badge>

          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
          </span>
        </div>

        {document.status === 'COMPLETED' && document.chunkCount && (
          <p className="text-xs text-muted-foreground mt-2">
            {document.chunkCount} chunks indexed
          </p>
        )}

        {document.status === 'FAILED' && document.errorMessage && (
          <p className="text-xs text-red-500 mt-2 line-clamp-2" title={document.errorMessage}>
            {document.errorMessage}
          </p>
        )}

        {document.source && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Source: {document.source === 'chat' ? 'Chat' : 'Documents'}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/50 flex gap-2">
        {document.status === 'COMPLETED' && onView && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs"
            onClick={() => onView(document.id)}
          >
            View
          </Button>
        )}

        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={() => onDelete(document.id)}
            disabled={document.status === 'PROCESSING'}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
