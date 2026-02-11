import { AppLayout } from '@/components/layout/app-layout';

export function ChatPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Chat Interface</h1>
        <p className="text-muted-foreground mt-2">
          Start a conversation or select an existing one
        </p>
      </div>
    </AppLayout>
  );
}
