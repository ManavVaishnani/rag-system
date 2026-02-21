import { FileText, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DocumentChipProps {
  documentId: string;
  documentName: string;
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  className?: string;
}

/**
 * Inline document reference chip shown in user messages after uploading.
 * Clicking navigates to the Documents page.
 */
export function DocumentChip({
  documentId,
  documentName,
  status = 'PROCESSING',
  className,
}: DocumentChipProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          iconClass: 'text-emerald-400',
          chipClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
          label: 'Ready',
        };
      case 'FAILED':
        return {
          icon: AlertCircle,
          iconClass: 'text-red-400',
          chipClass: 'bg-red-500/10 border-red-500/20 text-red-300',
          label: 'Failed',
        };
      default:
        return {
          icon: Loader2,
          iconClass: 'text-blue-400 animate-spin',
          chipClass: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
          label: 'Processing',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Link
      to={`/documents?highlight=${documentId}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
        'text-xs border transition-all duration-200',
        'hover:opacity-80 hover:shadow-sm',
        config.chipClass,
        className
      )}
      title={`${documentName} — ${config.label}. Click to view in Documents.`}
    >
      <FileText className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[150px] font-medium">{documentName}</span>
      <StatusIcon className={cn('h-3 w-3 shrink-0', config.iconClass)} />
      <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
    </Link>
  );
}
