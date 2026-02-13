import { useState, useCallback } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  isUploading?: boolean;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

const DEFAULT_MAX_FILE_SIZE = 10; // 10 MB
const DEFAULT_MAX_FILES = 10;
const DEFAULT_ACCEPTED_TYPES = ['.pdf', '.docx', '.txt', '.md'];

export function DocumentUpload({
  onUpload,
  isUploading = false,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate files
  const validateFiles = useCallback(
    (files: FileList | File[]): { valid: File[]; error: string | null } => {
      const fileArray = Array.from(files);

      // Check file count
      if (fileArray.length > maxFiles) {
        return {
          valid: [],
          error: `Maximum ${maxFiles} files allowed per upload`,
        };
      }

      // Validate each file
      const validFiles: File[] = [];
      const maxSizeBytes = maxFileSize * 1024 * 1024;

      for (const file of fileArray) {
        // Check file size
        if (file.size > maxSizeBytes) {
          return {
            valid: [],
            error: `File "${file.name}" exceeds ${maxFileSize} MB limit`,
          };
        }

        // Check file type
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!acceptedTypes.includes(fileExt)) {
          return {
            valid: [],
            error: `File "${file.name}" is not a supported type. Only ${acceptedTypes.join(', ')} files are allowed.`,
          };
        }

        validFiles.push(file);
      }

      return { valid: validFiles, error: null };
    },
    [maxFileSize, maxFiles, acceptedTypes]
  );

  // Handle file selection
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const { valid, error } = validateFiles(files);
      if (error) {
        setError(error);
        return;
      }

      onUpload(valid);

      // Reset input
      e.target.value = '';
    },
    [validateFiles, onUpload]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const { valid, error } = validateFiles(files);
      if (error) {
        setError(error);
        return;
      }

      onUpload(valid);
    },
    [validateFiles, onUpload]
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
          isDragging
            ? 'border-accent bg-accent/5 scale-[1.02]'
            : 'border-border hover:border-accent/50 hover:bg-accent/5',
          isUploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div
            className={cn(
              'p-4 rounded-full transition-colors',
              isDragging ? 'bg-accent text-accent-foreground' : 'bg-accent/10 text-accent'
            )}
          >
            {isUploading ? (
              <File className="h-8 w-8 animate-pulse" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isUploading ? 'Uploading...' : isDragging ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {!isUploading &&
                !isDragging &&
                `Drag and drop files here or click to browse. Supports ${acceptedTypes.join(', ')} files up to ${maxFileSize} MB each.`}
            </p>
          </div>

          {!isUploading && !isDragging && (
            <Button type="button" variant="outline" size="lg" className="pointer-events-none">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Accepted formats:</strong> {acceptedTypes.join(', ').toUpperCase()}
        </p>
        <p>
          <strong>Maximum file size:</strong> {maxFileSize} MB per file
        </p>
        <p>
          <strong>Maximum files:</strong> {maxFiles} files per upload
        </p>
      </div>
    </div>
  );
}
