

import * as React from "react"
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DataGridColumn<T> {
  key: keyof T
  header: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataGridProps<T> {
  data: T[]
  columns: DataGridColumn<T>[]
  searchable?: boolean
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  onRowClick?: (row: T) => void
  className?: string
}

type SortDirection = "asc" | "desc" | null

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  selectable = false,
  onSelectionChange,
  onRowClick,
  className,
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortColumn, setSortColumn] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set())
  const [filters, setFilters] = React.useState<Record<string, string>>({})

  // Filter data based on search term and filters
  const filteredData = React.useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((row) => String(row[key]).toLowerCase().includes(filterValue.toLowerCase()))
      }
    })

    return filtered
  }, [data, searchTerm, filters])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredData, sortColumn, sortDirection])

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
      if (sortDirection === "desc") {
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sortedData.map((_, index) => index)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    setSelectedRows(newSelected)
  }

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = Array.from(selectedRows).map((index) => sortedData[index])
      onSelectionChange(selectedData)
    }
  }, [selectedRows, sortedData, onSelectionChange])

  const isAllSelected = selectedRows.size === sortedData.length && sortedData.length > 0
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < sortedData.length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="bg-white">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-black">
              <tr>
                {selectable && (
                  <th className="w-12 p-4">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "p-4 text-left font-bold",
                      column.sortable && "cursor-pointer hover:bg-gray-100",
                      column.width && `w-[${column.width}]`,
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              "h-3 w-3",
                              sortColumn === column.key && sortDirection === "asc" ? "text-black" : "text-gray-400",
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 -mt-1",
                              sortColumn === column.key && sortDirection === "desc" ? "text-black" : "text-gray-400",
                            )}
                          />
                        </div>
                      )}
                      {column.filterable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <div className="p-2">
                              <Input
                                placeholder={`Filter ${column.header}...`}
                                value={filters[String(column.key)] || ""}
                                onChange={(e) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    [String(column.key)]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-12 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "border-b border-gray-200 hover:bg-gray-50",
                    onRowClick && "cursor-pointer",
                    selectedRows.has(index) && "bg-blue-50",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="p-4">
                      <Checkbox
                        checked={selectedRows.has(index)}
                        onCheckedChange={(checked) => handleSelectRow(index, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={String(column.key)} className="p-4">
                      {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                    </td>
                  ))}
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedData.length === 0 && <div className="p-8 text-center text-gray-500">No data found</div>}
      </div>

      {/* Selection Info */}
      {selectable && selectedRows.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <span className="text-sm font-medium">
            {selectedRows.size} of {sortedData.length} rows selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-white">
              Export Selected
            </Button>
            <Button size="sm" variant="outline" className="bg-white text-red-600 border-red-200">
              Delete Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
