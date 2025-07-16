

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  description?: string
  optional?: boolean
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  className?: string
  orientation?: "horizontal" | "vertical"
}

export function Stepper({ steps, currentStep, onStepClick, className, orientation = "horizontal" }: StepperProps) {
  const isStepComplete = (stepIndex: number) => stepIndex < currentStep
  const isStepCurrent = (stepIndex: number) => stepIndex === currentStep
  const isStepClickable = (stepIndex: number) => stepIndex <= currentStep && onStepClick

  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => isStepClickable(index) && onStepClick?.(index)}
                disabled={!isStepClickable(index)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 border-black font-bold text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  isStepComplete(index) && "bg-green-500 text-white hover:bg-green-600",
                  isStepCurrent(index) && "bg-orange-500 text-white",
                  !isStepComplete(index) && !isStepCurrent(index) && "bg-gray-200 text-gray-600",
                  isStepClickable(index) &&
                    "hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer",
                )}
              >
                {isStepComplete(index) ? <Check className="h-5 w-5" /> : index + 1}
              </button>
              {index < steps.length - 1 && <div className="mt-2 h-8 w-0.5 bg-gray-300" />}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-8">
              <h3
                className={cn(
                  "font-bold text-sm",
                  isStepCurrent(index) && "text-orange-600",
                  isStepComplete(index) && "text-green-600",
                )}
              >
                {step.title}
                {step.optional && <span className="ml-2 text-xs text-gray-500">(Optional)</span>}
              </h3>
              {step.description && <p className="text-sm text-gray-600 mt-1">{step.description}</p>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => isStepClickable(index) && onStepClick?.(index)}
              disabled={!isStepClickable(index)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 border-black font-bold text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                isStepComplete(index) && "bg-green-500 text-white hover:bg-green-600",
                isStepCurrent(index) && "bg-orange-500 text-white",
                !isStepComplete(index) && !isStepCurrent(index) && "bg-gray-200 text-gray-600",
                isStepClickable(index) &&
                  "hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer",
              )}
            >
              {isStepComplete(index) ? <Check className="h-5 w-5" /> : index + 1}
            </button>
            <div className="text-center">
              <p
                className={cn(
                  "font-bold text-sm",
                  isStepCurrent(index) && "text-orange-600",
                  isStepComplete(index) && "text-green-600",
                )}
              >
                {step.title}
              </p>
              {step.optional && <p className="text-xs text-gray-500">Optional</p>}
            </div>
          </div>
          {index < steps.length - 1 && <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mx-2" />}
        </React.Fragment>
      ))}
    </div>
  )
}
