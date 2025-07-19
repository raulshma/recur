

import * as React from "react"
import { Plus, Trash2, GripVertical, Eye, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface FormField {
  id: string
  type: "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio" | "switch"
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  conditional?: {
    dependsOn: string
    value: any
  }
}

interface FormBuilderProps {
  fields: FormField[]
  onFieldsChange: (fields: FormField[]) => void
  className?: string
}

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Group" },
  { value: "switch", label: "Switch" },
]

export function FormBuilder({ fields, onFieldsChange, className }: FormBuilderProps) {
  const [selectedField, setSelectedField] = React.useState<string | null>(null)
  const [previewMode, setPreviewMode] = React.useState(false)

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
    }
    onFieldsChange([...fields, newField])
    setSelectedField(newField.id)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    onFieldsChange(fields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }

  const removeField = (id: string) => {
    onFieldsChange(fields.filter((field) => field.id !== id))
    if (selectedField === id) {
      setSelectedField(null)
    }
  }

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex((field) => field.id === id)
    if (index === -1) return

    const newFields = [...fields]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < fields.length) {
      ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
      onFieldsChange(newFields)
    }
  }

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
      required: field.required,
    }

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return <Input type={field.type} {...commonProps} />
      case "textarea":
        return <Textarea {...commonProps} />
      case "select":
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "checkbox":
        return <Checkbox />
      case "radio":
        return (
          <RadioGroup>
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}_${index}`} />
                <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "switch":
        return <Switch />
      default:
        return <Input {...commonProps} />
    }
  }

  const selectedFieldData = fields.find((field) => field.id === selectedField)

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Form Builder */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Form Builder</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                  {previewMode ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {previewMode ? "Edit" : "Preview"}
                </Button>
                <Button onClick={addField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {previewMode ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold">Form Preview</h3>
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderFieldPreview(field)}
                    </div>
                  ))}
                  <Button className="w-full">Submit Form</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card
                      key={field.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                        selectedField === field.id && "ring-2 ring-orange-500",
                      )}
                      onClick={() => setSelectedField(field.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <div>
                              <p className="font-medium">{field.label}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{field.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveField(field.id, "up")
                              }}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveField(field.id, "down")
                              }}
                              disabled={index === fields.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeField(field.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p>No fields added yet. Click "Add Field" to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Field Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Field Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedFieldData ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={selectedFieldData.label}
                  onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="field-type">Field Type</Label>
                <Select
                  value={selectedFieldData.type}
                  onValueChange={(value) => updateField(selectedFieldData.id, { type: value as FormField["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={selectedFieldData.placeholder || ""}
                  onChange={(e) => updateField(selectedFieldData.id, { placeholder: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedFieldData.required}
                  onCheckedChange={(checked) => updateField(selectedFieldData.id, { required: checked })}
                />
                <Label>Required Field</Label>
              </div>

              {(selectedFieldData.type === "select" || selectedFieldData.type === "radio") && (
                <div>
                  <Label htmlFor="field-options">Options (one per line)</Label>
                  <Textarea
                    id="field-options"
                    value={selectedFieldData.options?.join("\n") || ""}
                    onChange={(e) =>
                      updateField(selectedFieldData.id, {
                        options: e.target.value.split("\n").filter((option) => option.trim()),
                      })
                    }
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              {(selectedFieldData.type === "text" || selectedFieldData.type === "number") && (
                <div className="space-y-4">
                  <h4 className="font-medium">Validation</h4>
                  {selectedFieldData.type === "number" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="min-value">Min Value</Label>
                        <Input
                          id="min-value"
                          type="number"
                          value={selectedFieldData.validation?.min || ""}
                          onChange={(e) =>
                            updateField(selectedFieldData.id, {
                              validation: {
                                ...selectedFieldData.validation,
                                min: e.target.value ? Number(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-value">Max Value</Label>
                        <Input
                          id="max-value"
                          type="number"
                          value={selectedFieldData.validation?.max || ""}
                          onChange={(e) =>
                            updateField(selectedFieldData.id, {
                              validation: {
                                ...selectedFieldData.validation,
                                max: e.target.value ? Number(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                  {selectedFieldData.type === "text" && (
                    <div>
                      <Label htmlFor="pattern">Pattern (Regex)</Label>
                      <Input
                        id="pattern"
                        value={selectedFieldData.validation?.pattern || ""}
                        onChange={(e) =>
                          updateField(selectedFieldData.id, {
                            validation: {
                              ...selectedFieldData.validation,
                              pattern: e.target.value,
                            },
                          })
                        }
                        placeholder="^[A-Za-z]+$"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Select a field to edit its properties</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
