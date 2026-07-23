import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

const toISODate = (date) => date.toISOString().split('T')[0]

const DateRangePicker = ({ dateRange, setDateRange }) => {
    const selectedDate = {
        from: new Date(dateRange.from + 'T00:00:00'),
        to: new Date(dateRange.to + 'T00:00:00'),
    }

    const handleSelect = (range) => {
        if (!range) return
        setDateRange({
            from: range.from ? toISODate(range.from) : dateRange.from,
            to: range.to ? toISODate(range.to) : dateRange.to,
        })
    }

    return (
        <div>
            <label className="text-xs font-semibold text-black uppercase block mb-1">
                Date Range
            </label>
            <Popover >
                <PopoverTrigger asChild>
                    <Button
                        variant="default"
                        className="justify-start text-left font-normal border-black bg-white h-8 px-3 hover:bg-gray-100 text-black hover:cursor-pointer"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-black" />
                        <span className="text-sm text-2xl text-black ">
                            {format(selectedDate.from, 'MMM d, yyyy')} – {format(selectedDate.to, 'MMM d, yyyy')}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        className="text-black border-black"
                        mode="range"
                        selected={selectedDate}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        disabled={{ after: new Date() }}
                        defaultMonth={selectedDate.from}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default DateRangePicker