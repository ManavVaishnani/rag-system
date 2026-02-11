import { AppLayout } from '@/components/layout/app-layout';

export function SettingsPage() {
  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>
    </AppLayout>
  );
}
