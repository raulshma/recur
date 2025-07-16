

import * as React from "react"
import { Download, FileText, Table, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DateRange } from "react-day-picker"

interface ExportColumn {
  key: string
  label: string
  type: "string" | "number" | "date" | "boolean"
  selected: boolean
}

interface ExportFormat {
  id: string
  name: string
  extension: string
  icon: React.ReactNode
  description: string
}

interface ExportJob {
  id: string
  name: string
  format: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  createdAt: Date
  downloadUrl?: string
  fileSize?: string
}

interface DataExportProps {
  columns: ExportColumn[]
  onColumnsChange: (columns: ExportColumn[]) => void
  onExport: (config: ExportConfig) => void
  exportJobs?: ExportJob[]
  className?: string
}

interface ExportConfig {
  format: string
  columns: string[]
  dateRange?: DateRange
  filters?: Record<string, any>
}

const exportFormats: ExportFormat[] = [
  {
    id: "csv",
    name: "CSV",
    extension: ".csv",
    icon: <Table className="h-4 w-4" />,
    description: "Comma-separated values, compatible with Excel",
  },
  {
    id: "json",
    name: "JSON",
    extension: ".json",
    icon: <FileText className="h-4 w-4" />,
    description: "JavaScript Object Notation, for developers",
  },
  {
    id: "pdf",
    name: "PDF",
    extension: ".pdf",
    icon: <FileText className="h-4 w-4" />,
    description: "Portable Document Format, for reports",
  },
  {
    id: "png",
    name: "PNG",
    extension: ".png",
    icon: <ImageIcon className="h-4 w-4" />,
    description: "Chart export as image",
  },
]

export function DataExport({ columns, onColumnsChange, onExport, exportJobs = [], className }: DataExportProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<string>("csv")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [exportName, setExportName] = React.useState("")

  const selectedColumns = columns.filter((col) => col.selected)
  const selectedFormat_data = exportFormats.find((f) => f.id === selectedFormat)

  const toggleColumn = (key: string) => {
    onColumnsChange(columns.map((col) => (col.key === key ? { ...col, selected: !col.selected } : col)))
  }

  const toggleAllColumns = (selected: boolean) => {
    onColumnsChange(columns.map((col) => ({ ...col, selected })))
  }

  const handleExport = () => {
    if (selectedColumns.length === 0) return

    const config: ExportConfig = {
      format: selectedFormat,
      columns: selectedColumns.map((col) => col.key),
      dateRange,
    }

    onExport(config)
  }

  const getStatusColor = (status: ExportJob["status"]) => {
    switch (status) {
      case "completed":
        return "success"
      case "processing":
        return "warning"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: ExportJob["status"]) => {
    switch (status) {
      case "completed":
        return "✓"
      case "processing":
        return "⏳"
      case "failed":
        return "✗"
      default:
        return "⏸"
    }
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>Configure your data export settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Format */}
            <div>
              <Label className="text-base font-medium">Export Format</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {exportFormats.map((format) => (
                  <Card
                    key={format.id}
                    className={`cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      selectedFormat === format.id ? "ring-2 ring-orange-500" : ""
                    }`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {format.icon}
                        <div>
                          <p className="font-medium">{format.name}</p>
                          <p className="text-xs text-gray-500">{format.extension}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {selectedFormat_data && <p className="text-sm text-gray-600 mt-2">{selectedFormat_data.description}</p>}
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-base font-medium">Date Range</Label>
              <div className="mt-2">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} placeholder="Select date range..." />
              </div>
            </div>

            {/* Column Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Columns to Export</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAllColumns(true)}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAllColumns(false)}>
                    Clear All
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-48 border-2 border-gray-200 rounded-md p-3">
                <div className="space-y-3">
                  {columns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox checked={column.selected} onCheckedChange={() => toggleColumn(column.key)} />
                      <Label className="flex-1 cursor-pointer" onClick={() => toggleColumn(column.key)}>
                        {column.label}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {column.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-gray-600 mt-2">{selectedColumns.length} columns selected</p>
            </div>

            {/* Export Button */}
            <Button onClick={handleExport} disabled={selectedColumns.length === 0} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data ({selectedColumns.length} columns)
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>Recent export jobs and downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {exportJobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Download className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No exports yet</p>
                  <p className="text-sm">Your export history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exportJobs.map((job) => (
                    <Card key={job.id} className="transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getStatusIcon(job.status)}</span>
                            <div>
                              <p className="font-medium">{job.name || `Export ${job.id.slice(0, 8)}`}</p>
                              <p className="text-sm text-gray-500">
                                {job.format.toUpperCase()} • {job.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                        </div>

                        {job.status === "processing" && (
                          <div className="mb-3">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">{job.progress}% complete</p>
                          </div>
                        )}

                        {job.status === "completed" && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{job.fileSize}</span>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}

                        {job.status === "failed" && (
                          <p className="text-sm text-red-600">Export failed. Please try again.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
