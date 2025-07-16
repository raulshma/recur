

import * as React from "react"
import { Plus, Grid, BarChart3, TrendingUp, Settings, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatsCard } from "@/components/ui/stats-card"
import { BarChart, LineChart } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface DashboardWidget {
  id: string
  type: "metric" | "chart" | "table" | "text"
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
}

interface DashboardTemplate {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
  preview: string
}

interface DashboardBuilderProps {
  widgets: DashboardWidget[]
  onWidgetsChange: (widgets: DashboardWidget[]) => void
  templates?: DashboardTemplate[]
  className?: string
}

const widgetTypes = [
  { id: "metric", name: "Metric Card", icon: <TrendingUp className="h-4 w-4" />, description: "Display key metrics" },
  { id: "chart", name: "Chart", icon: <BarChart3 className="h-4 w-4" />, description: "Data visualization" },
  { id: "table", name: "Data Table", icon: <Grid className="h-4 w-4" />, description: "Tabular data" },
  { id: "text", name: "Text Widget", icon: <Edit className="h-4 w-4" />, description: "Custom text content" },
]

const defaultTemplates: DashboardTemplate[] = [
  {
    id: "analytics",
    name: "Analytics Overview",
    description: "Key metrics and user analytics",
    preview: "📊",
    widgets: [
      {
        id: "users",
        type: "metric",
        title: "Total Users",
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: { value: "12,345", change: { value: 12, type: "increase" } },
      },
      {
        id: "sessions",
        type: "metric",
        title: "Active Sessions",
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: { value: "1,234", change: { value: 5, type: "increase" } },
      },
      {
        id: "chart",
        type: "chart",
        title: "User Growth",
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: { chartType: "line" },
      },
    ],
  },
  {
    id: "executive",
    name: "Executive Dashboard",
    description: "High-level business metrics",
    preview: "📈",
    widgets: [
      {
        id: "revenue",
        type: "metric",
        title: "Revenue",
        position: { x: 0, y: 0, w: 4, h: 2 },
        config: { value: "$45,678", change: { value: 8, type: "increase" } },
      },
      {
        id: "conversion",
        type: "metric",
        title: "Conversion Rate",
        position: { x: 4, y: 0, w: 4, h: 2 },
        config: { value: "3.2%", change: { value: -2, type: "decrease" } },
      },
    ],
  },
]

export function DashboardBuilder({
  widgets,
  onWidgetsChange,
  templates = defaultTemplates,
  className,
}: DashboardBuilderProps) {
  const [selectedWidget, setSelectedWidget] = React.useState<string | null>(null)
  const [addWidgetOpen, setAddWidgetOpen] = React.useState(false)
  const [newWidgetType, setNewWidgetType] = React.useState("")
  const [newWidgetTitle, setNewWidgetTitle] = React.useState("")
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false)

  const addWidget = () => {
    if (!newWidgetType || !newWidgetTitle) return

    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: newWidgetType as DashboardWidget["type"],
      title: newWidgetTitle,
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: {},
    }

    onWidgetsChange([...widgets, newWidget])
    setNewWidgetType("")
    setNewWidgetTitle("")
    setAddWidgetOpen(false)
  }

  const removeWidget = (id: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== id))
    if (selectedWidget === id) {
      setSelectedWidget(null)
    }
  }

  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    onWidgetsChange(widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)))
  }

  const loadTemplate = (template: DashboardTemplate) => {
    onWidgetsChange(template.widgets)
    setTemplateDialogOpen(false)
  }

  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      className: "h-full",
    }

    switch (widget.type) {
      case "metric":
        return (
          <StatsCard
            title={widget.title}
            value={widget.config.value || "0"}
            change={widget.config.change}
            icon={widget.config.icon}
            {...commonProps}
          />
        )
      case "chart":
        const chartData = [
          { name: "Jan", value: 400 },
          { name: "Feb", value: 300 },
          { name: "Mar", value: 600 },
          { name: "Apr", value: 800 },
        ]
        return widget.config.chartType === "line" ? (
          <Card {...commonProps}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={chartData} height={200} />
            </CardContent>
          </Card>
        ) : (
          <Card {...commonProps}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={chartData} height={200} />
            </CardContent>
          </Card>
        )
      case "table":
        return (
          <Card {...commonProps}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Grid className="h-12 w-12 mx-auto mb-4" />
                <p>Table widget placeholder</p>
              </div>
            </CardContent>
          </Card>
        )
      case "text":
        return (
          <Card {...commonProps}>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">{widget.title}</h3>
              <p className="text-gray-600">{widget.config.content || "Add your custom content here..."}</p>
            </CardContent>
          </Card>
        )
      default:
        return (
          <Card {...commonProps}>
            <CardContent className="p-6">
              <p>Unknown widget type</p>
            </CardContent>
          </Card>
        )
    }
  }

  const selectedWidgetData = widgets.find((w) => w.id === selectedWidget)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Builder</h2>
          <p className="text-gray-600">Create and customize your dashboard</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Grid className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Dashboard Templates</DialogTitle>
                <DialogDescription>Choose a template to get started quickly</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => loadTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{template.preview}</div>
                        <h3 className="font-bold">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{template.widgets.length} widgets</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Widget</DialogTitle>
                <DialogDescription>Choose a widget type and configure it</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="widget-title">Widget Title</Label>
                  <Input
                    id="widget-title"
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                    placeholder="Enter widget title"
                  />
                </div>
                <div>
                  <Label>Widget Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {widgetTypes.map((type) => (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          newWidgetType === type.id ? "ring-2 ring-orange-500" : ""
                        }`}
                        onClick={() => setNewWidgetType(type.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            {type.icon}
                            <div>
                              <p className="font-medium text-sm">{type.name}</p>
                              <p className="text-xs text-gray-500">{type.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addWidget} disabled={!newWidgetType || !newWidgetTitle}>
                  Add Widget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Dashboard Preview */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Preview</CardTitle>
              <CardDescription>Click on widgets to select and configure them</CardDescription>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Grid className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No widgets added yet</p>
                  <p>Click "Add Widget" to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4 min-h-[400px]">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={cn(
                        "relative group cursor-pointer transition-all",
                        `col-span-${Math.min(widget.position.w, 12)}`,
                        selectedWidget === widget.id && "ring-2 ring-orange-500 rounded-lg",
                      )}
                      onClick={() => setSelectedWidget(widget.id)}
                    >
                      {renderWidget(widget)}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white shadow-md">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSelectedWidget(widget.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeWidget(widget.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Widget Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>Configure the selected widget</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedWidgetData ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="widget-title-edit">Title</Label>
                  <Input
                    id="widget-title-edit"
                    value={selectedWidgetData.title}
                    onChange={(e) => updateWidget(selectedWidgetData.id, { title: e.target.value })}
                  />
                </div>

                {selectedWidgetData.type === "metric" && (
                  <>
                    <div>
                      <Label htmlFor="metric-value">Value</Label>
                      <Input
                        id="metric-value"
                        value={selectedWidgetData.config.value || ""}
                        onChange={(e) =>
                          updateWidget(selectedWidgetData.id, {
                            config: { ...selectedWidgetData.config, value: e.target.value },
                          })
                        }
                        placeholder="12,345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="change-value">Change %</Label>
                      <Input
                        id="change-value"
                        type="number"
                        value={selectedWidgetData.config.change?.value || ""}
                        onChange={(e) =>
                          updateWidget(selectedWidgetData.id, {
                            config: {
                              ...selectedWidgetData.config,
                              change: {
                                ...selectedWidgetData.config.change,
                                value: Number(e.target.value),
                                type: Number(e.target.value) >= 0 ? "increase" : "decrease",
                              },
                            },
                          })
                        }
                        placeholder="12"
                      />
                    </div>
                  </>
                )}

                {selectedWidgetData.type === "chart" && (
                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select
                      value={selectedWidgetData.config.chartType || "bar"}
                      onValueChange={(value) =>
                        updateWidget(selectedWidgetData.id, {
                          config: { ...selectedWidgetData.config, chartType: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedWidgetData.type === "text" && (
                  <div>
                    <Label htmlFor="text-content">Content</Label>
                    <Input
                      id="text-content"
                      value={selectedWidgetData.config.content || ""}
                      onChange={(e) =>
                        updateWidget(selectedWidgetData.id, {
                          config: { ...selectedWidgetData.config, content: e.target.value },
                        })
                      }
                      placeholder="Enter your text content"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a widget to configure</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
