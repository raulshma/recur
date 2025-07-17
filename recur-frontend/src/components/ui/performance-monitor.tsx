

import React from "react"
import { Activity, Clock, Cpu, HardDrive, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Progress } from "./progress"

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  componentCount: number
  reRenderCount: number
  loadTime: number
}

interface PerformanceMonitorProps {
  componentName?: string
  showInProduction?: boolean
}

export function PerformanceMonitor({ componentName = "Component", showInProduction = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0,
    loadTime: 0,
  })
  const [isVisible, setIsVisible] = React.useState(false)
  const renderCountRef = React.useRef(0)
  const startTimeRef = React.useRef(performance.now())

  // Don't show in production unless explicitly enabled
  React.useEffect(() => {
    if (!import.meta.env.DEV && !showInProduction) {
      return
    }
    setIsVisible(true)
  }, [showInProduction])

  // Track performance metrics
  React.useEffect(() => {
    if (!isVisible) return

    const updateMetrics = () => {
      renderCountRef.current += 1
      const currentTime = performance.now()
      const renderTime = currentTime - startTimeRef.current

      // Get memory usage if available
      const memoryInfo = (performance as any).memory
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0

      // Count DOM elements as proxy for component count
      const componentCount = document.querySelectorAll("*").length

      setMetrics({
        renderTime: Math.round(renderTime * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        componentCount,
        reRenderCount: renderCountRef.current,
        loadTime: Math.round((currentTime - startTimeRef.current) * 100) / 100,
      })
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 1000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const getPerformanceStatus = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return { status: "good", color: "success" }
    if (value < thresholds[1]) return { status: "warning", color: "warning" }
    return { status: "poor", color: "destructive" }
  }

  const renderTimeStatus = getPerformanceStatus(metrics.renderTime, [16, 33])
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, [50, 100])

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance Monitor
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {componentName}
            </Badge>
          </div>
          <CardDescription className="text-xs">Real-time performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Render Time */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>Render Time</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-mono">{metrics.renderTime}ms</span>
                <Badge variant={renderTimeStatus.color as any} className="text-xs px-1 py-0">
                  {renderTimeStatus.status}
                </Badge>
              </div>
            </div>
            <Progress value={Math.min((metrics.renderTime / 50) * 100, 100)} className="h-1" />
          </div>

          {/* Memory Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <HardDrive className="h-3 w-3 mr-1" />
                <span>Memory Usage</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-mono">{metrics.memoryUsage}MB</span>
                <Badge variant={memoryStatus.color as any} className="text-xs px-1 py-0">
                  {memoryStatus.status}
                </Badge>
              </div>
            </div>
            <Progress value={Math.min((metrics.memoryUsage / 200) * 100, 100)} className="h-1" />
          </div>

          {/* Component Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Cpu className="h-3 w-3 mr-1" />
                <span>Components</span>
              </div>
              <span className="font-mono">{metrics.componentCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                <span>Re-renders</span>
              </div>
              <span className="font-mono">{metrics.reRenderCount}</span>
            </div>
          </div>

          {/* Performance Tips */}
          {(renderTimeStatus.status === "poor" || memoryStatus.status === "poor") && (
            <div className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">Performance Tips:</p>
              <ul className="text-yellow-700 mt-1 space-y-1">
                {renderTimeStatus.status === "poor" && <li>• Consider memoizing expensive calculations</li>}
                {memoryStatus.status === "poor" && <li>• Check for memory leaks in useEffect</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
