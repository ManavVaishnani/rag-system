import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">RAG System</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-card-foreground">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
