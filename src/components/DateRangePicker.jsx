import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

const parseLocalDate = (dateString) => {
    if (!dateString) return null
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

const toISODate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const DateRangePicker = ({ dateRange, setDateRange }) => {
    const [fromOpen, setFromOpen] = useState(false)
    const [toOpen, setToOpen] = useState(false)
    const fromDate = parseLocalDate(dateRange.from)
    const toDate = parseLocalDate(dateRange.to)

    const handleFromSelect = (date) => {
        if (!date) return
        const from = toISODate(date)
        setDateRange({
            from,
            to: toDate < date ? from : dateRange.to,
        })
        setFromOpen(false)
    }

    const handleToSelect = (date) => {
        if (!date) return
        setDateRange({ ...dateRange, to: toISODate(date) })
        setToOpen(false)
    }

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div>
                <label className="text-xs font-semibold text-black uppercase block mb-1">
                    From
                </label>
                <Popover open={fromOpen} onOpenChange={setFromOpen}>
                    <PopoverTrigger asChild>
                        <Button

                            className="w-[150px] justify-start text-left font-medium border-black h-8 px-3  text-black bg-white hover:bg-gray-100"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-black" />
                            {format(fromDate, 'MMM d, yyyy')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            className="text-black border-black"
                            mode="single"
                            selected={fromDate}
                            onSelect={handleFromSelect}
                            disabled={{ after: new Date() }}
                            defaultMonth={fromDate}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div>
                <label className="text-xs font-semibold text-black uppercase block mb-1">
                    To
                </label>
                <Popover open={toOpen} onOpenChange={setToOpen}>
                    <PopoverTrigger asChild>
                        <Button

                            className="w-[150px] justify-start text-left font-medium border-black bg-white h-8 px-3 hover:bg-gray-100 text-black"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-black" />
                            {format(toDate, 'MMM d, yyyy')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            className="text-black border-black"
                            mode="single"
                            selected={toDate}
                            onSelect={handleToSelect}
                            disabled={{ before: fromDate, after: new Date() }}
                            defaultMonth={toDate}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

export default DateRangePicker
