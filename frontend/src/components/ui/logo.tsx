import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { wrapper: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-sm' },
  md: { wrapper: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-lg' },
  lg: { wrapper: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center',
          'hover:bg-accent/20 transition-colors',
          config.wrapper
        )}
      >
        <MessageSquare className={cn('text-accent', config.icon)} />
      </div>
      {showText && (
        <span className={cn('font-semibold', config.text)}>RAG System</span>
      )}
    </div>
  );
}
