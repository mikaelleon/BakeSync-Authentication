"use client"

import * as React from "react"
import { X, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(undefined)

  React.useEffect(() => {
    if (open && triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(selected.filter((item) => item !== value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "w-full justify-between min-h-9 h-auto px-3 py-2",
            !selected.length && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selected.length === 0 ? (
              <span className="text-sm">{placeholder}</span>
            ) : (
              selected.map((value) => {
                const option = options.find((opt) => opt.value === value)
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1 mb-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    {option?.label || value}
                    <button
                      type="button"
                      className="ml-1.5 rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleRemove(value, e)
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleRemove(value, e)
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                )
              })
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform ml-2", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("p-0 min-w-[200px] max-w-[400px]", className)} 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
        style={{ width: popoverWidth ? `${popoverWidth}px` : 'auto' }}
        onEscapeKeyDown={(e) => {
          setOpen(false)
        }}
      >
        <div className="max-h-60 overflow-auto p-1">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-sm cursor-pointer select-none hover:bg-accent transition-colors",
                    isSelected && "bg-accent/50"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        if (!selected.includes(option.value)) {
                          onChange([...selected, option.value])
                        }
                      } else {
                        onChange(selected.filter((item) => item !== option.value))
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  />
                  <label
                    className="flex-1 cursor-pointer text-sm font-medium leading-none"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(option.value)
                    }}
                  >
                    {option.label}
                  </label>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
