import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
