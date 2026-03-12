"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function DatePicker({
    date,
    setDate,
    placeholder = "Pick a date",
    className
}: {
    date?: Date,
    setDate: (date?: Date) => void,
    placeholder?: string,
    className?: string
}) {
    return (
        <Popover>
            <PopoverTrigger>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-between text-left font-medium h-12 bg-white/20 backdrop-blur-md border border-white/20 text-black hover:bg-white/30 focus:bg-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 pl-10",
                        !date && "text-slate-600",
                        className
                    )}
                >
                    <span className="truncate">{date ? format(date, "PPP") : placeholder}</span>
                    <ChevronDownIcon className="w-4 h-4 text-slate-700 pointer-events-none shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-2xl rounded-xl" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    autoFocus
                    className="bg-white text-slate-900 rounded-lg shadow-xl"
                />
            </PopoverContent>
        </Popover>

    )
}
