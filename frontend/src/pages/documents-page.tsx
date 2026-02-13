import { useEffect, useState } from 'react';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentList } from '@/components/documents/document-list';
import { UploadProgress } from '@/components/documents/upload-progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDocumentStore } from '@/stores/document-store';
import { toast } from 'sonner';
import type { UploadProgress as UploadProgressType } from '@/types/document.types';

export function DocumentsPage() {
  const {
    documents,
    isLoading,
    isUploading,
    error,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
    getDocumentStatus,
    clearError,
  } = useDocumentStore();

  const [uploads, setUploads] = useState<UploadProgressType[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Poll processing documents
  useEffect(() => {
    const processingDocs = documents.filter((doc) => doc.status === 'PROCESSING');
    if (processingDocs.length === 0) return;

    const interval = setInterval(() => {
      processingDocs.forEach((doc) => {
        getDocumentStatus(doc.id);
      });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [documents, getDocumentStatus]);

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    // Initialize upload progress
    const initialUploads: UploadProgressType[] = files.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));
    setUploads(initialUploads);

    // Update to uploading
    setUploads((prev) =>
      prev.map((u) => ({
        ...u,
        status: 'uploading',
        progress: 10,
      }))
    );

    try {
      const uploadedDocs = await uploadDocuments(files, 'documents');

      if (uploadedDocs.length > 0) {
        // Mark as completed
        setUploads((prev) =>
          prev.map((u) => ({
            ...u,
            status: 'completed',
            progress: 100,
          }))
        );

        toast.success(`Successfully uploaded ${uploadedDocs.length} ${uploadedDocs.length === 1 ? 'file' : 'files'}`);

        // Clear uploads after a delay
        setTimeout(() => {
          setUploads([]);
          setShowUploadZone(false);
        }, 2000);
      } else {
        // Mark as error
        setUploads((prev) =>
          prev.map((u) => ({
            ...u,
            status: 'error',
            error: 'Upload failed',
          }))
        );
      }
    } catch (err) {
      // Mark as error
      setUploads((prev) =>
        prev.map((u) => ({
          ...u,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        }))
      );
    }
  };

  // Handle document deletion
  const handleDeleteClick = (id: string) => {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete);
      toast.success('Document deleted successfully');
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Handle document view
  const handleView = (id: string) => {
    // In the future, this could open a document viewer
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      toast.info(`Viewing: ${doc.originalName}`);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-accent" />
              Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your uploaded documents
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => setShowUploadZone(!showUploadZone)}
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <Separator />

        {/* Upload Zone */}
        {showUploadZone && (
          <DocumentUpload
            onUpload={handleUpload}
            isUploading={isUploading}
            maxFileSize={10}
            maxFiles={10}
            acceptedTypes={['.pdf', '.docx', '.txt', '.md']}
          />
        )}

        {/* Upload Progress */}
        {uploads.length > 0 && <UploadProgress uploads={uploads} />}

        {/* Documents Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm text-muted-foreground">Total Documents</p>
            <p className="text-2xl font-bold mt-1">{documents.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold mt-1">
              {documents.filter((d) => d.status === 'PROCESSING').length}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm text-muted-foreground">Ready</p>
            <p className="text-2xl font-bold mt-1">
              {documents.filter((d) => d.status === 'COMPLETED').length}
            </p>
          </div>
        </div>

        {/* Document List */}
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onDelete={handleDeleteClick}
          onView={handleView}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this document? This action cannot be undone and
                will remove the document from all conversations.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDocumentToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
