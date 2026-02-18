import { Link } from 'react-router-dom';
import { ArrowRight, FileText, MessageSquare, Zap, Shield, Search, Upload, ChevronRight, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold text-lg">RAG System</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
              <Link to="/register">Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(oklch(0.72 0.18 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.18 250) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-sm mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by Google Gemini AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Chat with your{' '}
            <span
              className="bg-gradient-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent"
            >
              documents
            </span>
            <br />
            intelligently
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload PDFs, Word docs, and text files. Ask questions in natural language.
            Get precise answers with source citations — powered by RAG technology.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 h-12 text-base shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
              asChild
            >
              <Link to="/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 h-12 text-base border-border/60 hover:border-accent/40 hover:bg-accent/5"
              asChild
            >
              <Link to="/login">
                Sign in
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground/60">
            No credit card required · Supports PDF, DOCX, TXT, MD
          </p>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-5 rounded bg-muted/50 max-w-xs mx-auto" />
              </div>
            </div>
            {/* App preview */}
            <div className="flex h-80">
              {/* Sidebar preview */}
              <div className="w-48 border-r border-border/50 bg-card/60 p-3 space-y-1.5">
                <div className="h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center px-2 gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="h-2 rounded bg-accent/40 flex-1" />
                </div>
                {['Research Paper', 'Q3 Report', 'Meeting Notes', 'Product Spec'].map((_title, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-8 rounded-lg flex items-center px-2 gap-2",
                      i === 0 ? "bg-accent/10 border border-accent/20" : "bg-muted/30"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", i === 0 ? "bg-accent/60" : "bg-muted-foreground/30")} />
                    <div className={cn("h-1.5 rounded flex-1", i === 0 ? "bg-accent/40" : "bg-muted-foreground/20")} />
                  </div>
                ))}
              </div>
              {/* Chat preview */}
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-accent/20 border border-accent/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[70%]">
                    <div className="space-y-1">
                      <div className="h-2 rounded bg-accent/50 w-48" />
                      <div className="h-2 rounded bg-accent/40 w-36" />
                    </div>
                  </div>
                </div>
                {/* AI response */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
                    <Brain className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[75%]">
                    <div className="space-y-1.5">
                      <div className="h-2 rounded bg-muted-foreground/30 w-56" />
                      <div className="h-2 rounded bg-muted-foreground/25 w-48" />
                      <div className="h-2 rounded bg-muted-foreground/20 w-40" />
                    </div>
                    {/* Source chips */}
                    <div className="flex gap-1.5 mt-2.5">
                      {['Doc 1', 'Doc 2'].map((s) => (
                        <div key={s} className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] text-accent">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Streaming indicator */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
                    <Brain className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect under the card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-accent/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to work smarter
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete document intelligence platform built for professionals who need fast, accurate answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-border/30 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get answers in 3 simple steps
            </h2>
            <p className="text-muted-foreground text-lg">
              From upload to insight in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <step.icon className="h-7 w-7 text-accent" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ChevronRight className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border border-accent/20 bg-card/50 backdrop-blur-sm p-12">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join and start having intelligent conversations with your documents today.
              </p>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 h-12 text-base shadow-lg shadow-accent/20"
                asChild
              >
                <Link to="/register">
                  Create free account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-accent" />
            </div>
            <span className="text-sm font-medium">RAG System</span>
          </div>
          <p className="text-sm text-muted-foreground/60">
            Built with React, TypeScript & Google Gemini
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground/60">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Conversational AI',
    description: 'Ask questions in plain English. Get precise, contextual answers drawn directly from your documents.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: Upload,
    title: 'Multi-format Upload',
    description: 'Supports PDF, DOCX, TXT, and Markdown files. Upload up to 10 files at once from anywhere in the app.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    icon: Search,
    title: 'Source Citations',
    description: 'Every answer includes references to the exact document sections used, so you can verify and explore further.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description: 'Watch answers appear in real-time as the AI processes your query. No waiting for complete responses.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description: 'Organize all your documents in one place. Track processing status and manage your knowledge base.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'JWT authentication, rate limiting, and secure token refresh. Your documents stay private and protected.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
];

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your documents',
    description: 'Drag & drop or click to upload PDFs, Word docs, or text files. Supports up to 10 files at once.',
  },
  {
    icon: Brain,
    title: 'AI processes your content',
    description: 'Our system chunks, embeds, and indexes your documents using vector search for lightning-fast retrieval.',
  },
  {
    icon: MessageSquare,
    title: 'Ask anything',
    description: 'Start a conversation. Get precise answers with citations pointing to the exact source in your documents.',
  },
];

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}

function FeatureCard({ icon: Icon, title, description, color, bg, border }: FeatureCardProps) {
  return (
    <div className={cn(
      "group p-6 rounded-2xl border bg-card/50 backdrop-blur-sm",
      "hover:border-accent/30 hover:bg-card/80 transition-all duration-300",
      "hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
      "border-border/50"
    )}>
      <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center mb-4 transition-transform group-hover:scale-110", bg, border)}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
