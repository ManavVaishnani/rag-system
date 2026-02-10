import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-foreground">RAG System Frontend</h1>
        <p className="text-muted-foreground">
          Phase 1: Project Setup - ✅ Complete
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>All components initialized successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">React 19</Badge>
              <Badge variant="default">TypeScript</Badge>
              <Badge variant="default">Vite 6</Badge>
              <Badge variant="default">Tailwind CSS v4.1</Badge>
              <Badge variant="default">shadcn/ui</Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Test Input:</p>
              <Input placeholder="Type something..." />
            </div>
            
            <div className="flex gap-2">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-sm text-muted-foreground text-center">
          Ready for Phase 2: Core Infrastructure
        </p>
      </div>
    </div>
  )
}

export default App
