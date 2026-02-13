import { FileText, File, FileCode, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { UploadProgress as UploadProgressType } from '@/types/document.types';

interface UploadProgressProps {
  uploads: UploadProgressType[];
  onCancel?: (fileName: string) => void;
}

// Get file icon based on file name extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  if (ext === 'txt' || ext === 'md') return FileCode;
  return File;
};

export function UploadProgress({ uploads, onCancel }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">
              Uploading {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
            </h3>
            <span className="text-xs text-muted-foreground">
              {uploads.filter((u) => u.status === 'completed').length}/{uploads.length} completed
            </span>
          </div>

          <div className="space-y-3">
            {uploads.map((upload) => {
              const FileIcon = getFileIcon(upload.fileName);

              return (
                <div key={upload.fileName} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon className="h-4 w-4 text-accent shrink-0" />
                      <span className="text-sm truncate" title={upload.fileName}>
                        {upload.fileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {upload.status === 'pending' && (
                        <span className="text-xs text-muted-foreground">Pending...</span>
                      )}

                      {upload.status === 'uploading' && (
                        <span className="text-xs text-blue-500">{upload.progress}%</span>
                      )}

                      {upload.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}

                      {upload.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}

                      {upload.status === 'uploading' && onCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => onCancel(upload.fileName)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="h-1" />
                  )}

                  {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-500">{upload.error}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall progress */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span>
                {Math.round(
                  (uploads.filter((u) => u.status === 'completed').length / uploads.length) * 100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (uploads.filter((u) => u.status === 'completed').length / uploads.length) * 100
              }
              className="h-2 mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
