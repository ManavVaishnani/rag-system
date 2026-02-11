import { AppLayout } from '@/components/layout/app-layout';

export function DocumentsPage() {
  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Documents</h1>
        <p className="text-muted-foreground">
          Manage your uploaded documents
        </p>
      </div>
    </AppLayout>
  );
}
