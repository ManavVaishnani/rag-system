import { useState, useCallback } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFiles: (files: File[]) => void;
  isUploading?: boolean;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  acceptedExtensions?: string[];
  className?: string;
  /** Override the label shown in the drop zone */
  label?: string;
  /** Override the description shown under the label */
  description?: string;
}

const DEFAULT_MAX_FILE_SIZE = 10; // MB
const DEFAULT_MAX_FILES = 10;
const DEFAULT_ACCEPTED = ['.pdf', '.docx', '.txt', '.md'];

/**
 * Reusable drag-and-drop file upload zone.
 * Handles validation (type, size, count) and emits valid files via `onFiles`.
 */
export function FileUploadZone({
  onFiles,
  isUploading = false,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  acceptedExtensions = DEFAULT_ACCEPTED,
  className,
  label = 'Upload Files',
  description,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: FileList | File[]): { valid: File[]; error: string | null } => {
      const arr = Array.from(files);
      if (arr.length > maxFiles) {
        return { valid: [], error: `Maximum ${maxFiles} files allowed per upload` };
      }
      const maxBytes = maxFileSize * 1024 * 1024;
      const valid: File[] = [];
      for (const file of arr) {
        if (file.size > maxBytes) {
          return { valid: [], error: `"${file.name}" exceeds ${maxFileSize} MB limit` };
        }
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!acceptedExtensions.includes(ext)) {
          return {
            valid: [],
            error: `"${file.name}" is not supported. Accepted: ${acceptedExtensions.join(', ')}`,
          };
        }
        valid.push(file);
      }
      return { valid, error: null };
    },
    [maxFileSize, maxFiles, acceptedExtensions]
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setValidationError(null);
      const { valid, error } = validateFiles(files);
      if (error) {
        setValidationError(error);
        return;
      }
      onFiles(valid);
    },
    [validateFiles, onFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      e.target.value = '';
    },
    [processFiles]
  );

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
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const defaultDescription =
    `Drag & drop or click to browse. Supports ${acceptedExtensions.join(', ')} up to ${maxFileSize} MB each.`;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : 'border-border hover:border-accent/50 hover:bg-accent/5',
          isUploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          type="file"
          multiple
          accept={acceptedExtensions.join(',')}
          onChange={handleFileInput}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div
            className={cn(
              'p-4 rounded-full transition-colors',
              isDragging ? 'bg-accent text-accent-foreground' : 'bg-accent/10 text-accent'
            )}
          >
            {isUploading ? (
              <File className="h-7 w-7 animate-pulse" />
            ) : (
              <Upload className="h-7 w-7" />
            )}
          </div>

          <div>
            <p className="font-semibold text-base">
              {isUploading
                ? 'Uploading…'
                : isDragging
                ? 'Drop files here'
                : label}
            </p>
            {!isUploading && !isDragging && (
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {description ?? defaultDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {validationError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{validationError}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Accepted: {acceptedExtensions.join(', ').toUpperCase()} · Max {maxFileSize} MB per file · Up to {maxFiles} files
      </p>
    </div>
  );
}
