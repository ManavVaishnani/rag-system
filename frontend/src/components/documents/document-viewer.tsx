import { useState, useEffect, useCallback } from 'react';
import { FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { documentService } from '@/services/document.service';
import type { DocumentContentResponse } from '@/types/document.types';

interface DocumentViewerProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ documentId, isOpen, onClose }: DocumentViewerProps) {
  const [content, setContent] = useState<DocumentContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  const loadDocumentContent = useCallback(async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentChunkIndex(0);
    
    try {
      const data = await documentService.getDocumentContent(documentId);
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document content');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId && isOpen) {
      loadDocumentContent();
    }
  }, [documentId, isOpen, loadDocumentContent]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePrevious = () => {
    setCurrentChunkIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (content) {
      setCurrentChunkIndex((prev) => 
        Math.min(content.chunks.length - 1, prev + 1)
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                content?.document.originalName || 'Document Viewer'
              )}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : content ? (
            <div className="h-full flex flex-col min-h-0">
              {/* Document Info */}
              <div className="px-6 py-3 border-b bg-muted/50">
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">
                    {content.chunks.length} chunks
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatFileSize(content.document.fileSize)}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(content.document.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Chunk Content */}
              <ScrollArea className="flex-1 overflow-y-auto p-6">
                {content.chunks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Chunk {currentChunkIndex + 1} of {content.chunks.length}
                      </span>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {content.chunks[currentChunkIndex]?.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No content available
                  </div>
                )}
              </ScrollArea>

              {/* Navigation */}
              {content.chunks.length > 1 && (
                <div className="px-6 py-3 border-t flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentChunkIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentChunkIndex + 1} / {content.chunks.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentChunkIndex === content.chunks.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}