import { FileX } from 'lucide-react';
import { DocumentCard } from './document-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/types/document.types';

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export function DocumentList({ documents, isLoading, onDelete, onView }: DocumentListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileX className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Upload your first document to get started. You can upload PDFs, DOCX, TXT, or MD files.
        </p>
      </div>
    );
  }

  // Document grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
}
