import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Source } from '@/types';

interface SourceCitationsProps {
  sources: Source[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header with toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Quote className="h-3 w-3 mr-1.5" />
        <span>Sources ({sources.length})</span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Button>

      {/* Sources List */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sources.map((source, index) => (
            <SourceCard key={`${source.documentId}-${index}`} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SourceCardProps {
  source: Source;
}

function SourceCard({ source }: SourceCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  
  // Truncate content if too long
  const maxLength = 200;
  const shouldTruncate = source.content.length > maxLength;
  const displayContent = showFullContent 
    ? source.content 
    : shouldTruncate 
      ? source.content.slice(0, maxLength) + '...' 
      : source.content;

  return (
    <div className="bg-muted/50 rounded-lg p-3 text-sm border border-border/50">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="font-medium truncate" title={source.documentName}>
            {source.documentName}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {(source.score * 100).toFixed(0)}% match
        </Badge>
      </div>

      {/* Content */}
      <p className={cn(
        "text-muted-foreground text-xs leading-relaxed",
        !showFullContent && "line-clamp-3"
      )}>
        "{displayContent}"
      </p>

      {/* Show more/less */}
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-0.5 px-0 mt-1 text-xs text-accent hover:text-accent"
          onClick={() => setShowFullContent(!showFullContent)}
        >
          {showFullContent ? 'Show less' : 'Show more'}
        </Button>
      )}

      {/* Footer */}
      <div className="mt-2 text-xs text-muted-foreground">
        Chunk {source.chunkIndex + 1}
      </div>
    </div>
  );
}
