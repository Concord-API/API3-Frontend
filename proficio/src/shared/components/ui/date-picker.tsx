import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Calendar } from "@/shared/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"

type DatePickerProps = {
  value?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  className?: string
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  fromYear?: number
  toYear?: number
  disableFuture?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
  buttonVariant = "outline",
  fromYear = 1950,
  toYear = new Date().getFullYear(),
  disableFuture = true,
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value)

  React.useEffect(() => {
    setInternalDate(value)
  }, [value])

  function handleSelect(next?: Date) {
    setInternalDate(next)
    onChange?.(next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          data-empty={!internalDate}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon className="mr-2" />
          {internalDate ? format(internalDate, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          selected={internalDate}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
          disabled={disableFuture ? { after: new Date() } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}


