

import * as React from "react"
import { Code, Copy, Eye, Palette, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ComponentExample {
  id: string
  name: string
  description: string
  category: string
  component: React.ReactNode
  code: string
  props?: Record<string, any>
}

interface ComponentPlaygroundProps {
  examples: ComponentExample[]
  className?: string
}

const defaultExamples: ComponentExample[] = [
  {
    id: "button-default",
    name: "Default Button",
    description: "A standard button with PostHog styling",
    category: "buttons",
    component: <Button>Click me</Button>,
    code: `<Button>Click me</Button>`,
    props: {
      variant: "default",
      size: "default",
      disabled: false,
    },
  },
  {
    id: "button-variants",
    name: "Button Variants",
    description: "Different button styles",
    category: "buttons",
    component: (
      <div className="flex space-x-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    ),
    code: `<div className="flex space-x-2">
  <Button variant="default">Default</Button>
  <Button variant="destructive">Destructive</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
</div>`,
  },
  {
    id: "badge-variants",
    name: "Badge Variants",
    description: "Different badge styles for status indicators",
    category: "display",
    component: (
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    ),
    code: `<div className="flex flex-wrap gap-2">
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="outline">Outline</Badge>
</div>`,
  },
]

export function ComponentPlayground({ examples = defaultExamples, className }: ComponentPlaygroundProps) {
  const [selectedExample, setSelectedExample] = React.useState<string>(examples[0]?.id || "")
  const [showCode, setShowCode] = React.useState(false)
  const [customProps, setCustomProps] = React.useState<Record<string, any>>({})

  const categories = React.useMemo(() => {
    const cats = new Set(examples.map((ex) => ex.category))
    return Array.from(cats)
  }, [examples])

  const selectedExampleData = examples.find((ex) => ex.id === selectedExample)

  const copyCode = () => {
    if (selectedExampleData) {
      navigator.clipboard.writeText(selectedExampleData.code)
      toast.success("Code copied to clipboard!")
    }
  }

  const updateProp = (key: string, value: any) => {
    setCustomProps((prev) => ({ ...prev, [key]: value }))
  }

  const renderPropControl = (key: string, value: any) => {
    if (typeof value === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <Switch checked={customProps[key] ?? value} onCheckedChange={(checked) => updateProp(key, checked)} />
          <Label>{key}</Label>
        </div>
      )
    }

    if (typeof value === "string") {
      return (
        <div>
          <Label htmlFor={key}>{key}</Label>
          <Input
            id={key}
            value={customProps[key] ?? value}
            onChange={(e) => updateProp(key, e.target.value)}
            placeholder={value}
          />
        </div>
      )
    }

    if (typeof value === "number") {
      return (
        <div>
          <Label htmlFor={key}>{key}</Label>
          <Input
            id={key}
            type="number"
            value={customProps[key] ?? value}
            onChange={(e) => updateProp(key, Number(e.target.value))}
          />
        </div>
      )
    }

    return (
      <div>
        <Label htmlFor={key}>{key}</Label>
        <Input id={key} value={customProps[key] ?? String(value)} onChange={(e) => updateProp(key, e.target.value)} />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Component Playground</h2>
          <p className="text-gray-600">Explore and test PostHog UI components</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowCode(!showCode)}>
            {showCode ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
            {showCode ? "Preview" : "Code"}
          </Button>
          <Button variant="outline" size="sm" onClick={copyCode}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Component List */}
        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>Browse available components</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 capitalize">{category}</h4>
                    <div className="space-y-1 pl-2">
                      {examples
                        .filter((ex) => ex.category === category)
                        .map((example) => (
                          <Card
                            key={example.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                              selectedExample === example.id && "ring-2 ring-orange-500",
                            )}
                            onClick={() => setSelectedExample(example.id)}
                          >
                            <CardContent className="p-3">
                              <p className="font-medium text-sm">{example.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{example.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preview/Code */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedExampleData?.name}</CardTitle>
                  <CardDescription>{selectedExampleData?.description}</CardDescription>
                </div>
                <Badge variant="outline">{selectedExampleData?.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {showCode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Code</h4>
                    <Button variant="outline" size="sm" onClick={copyCode}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-200 p-4 rounded-md border-2 border-black overflow-x-auto">
                    <pre className="text-sm">
                      <code>{selectedExampleData?.code}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Preview</h4>
                    <div className="flex items-center space-x-2">
                      <Palette className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Interactive</span>
                    </div>
                  </div>
                  <div className="min-h-[200px] flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {selectedExampleData?.component}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Props Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Customize component props</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedExampleData?.props ? (
              <div className="space-y-4">
                {Object.entries(selectedExampleData.props).map(([key, value]) => (
                  <div key={key}>{renderPropControl(key, value)}</div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => setCustomProps({})}
                >
                  Reset Props
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No configurable props</p>
                <p className="text-sm">This component has no customizable properties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>How to use this component in your project</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="installation">
            <TabsList>
              <TabsTrigger value="installation">Installation</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="installation" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Install the component</h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md border-2 border-black">
                  <code className="text-sm">npm install posthog-ui-library</code>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="import" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Import the component</h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md border-2 border-black">
                  <code className="text-sm">import {`{ Button }`} from 'posthog-ui-library'</code>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="usage" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Use in your component</h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md border-2 border-black">
                  <pre className="text-sm">
                    <code>{selectedExampleData?.code}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
