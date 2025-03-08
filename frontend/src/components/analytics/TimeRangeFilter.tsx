import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimeRange } from '@/types/api';
import { CalendarIcon } from 'lucide-react';
import { addDays, format, startOfDay, subDays, subMonths, subWeeks } from 'date-fns';

interface TimeRangeFilterProps {
  value: TimeRange;
  startDate?: Date;
  endDate?: Date;
  onChange: (range: TimeRange, start?: Date, end?: Date) => void;
}

export function TimeRangeFilter({
  value,
  startDate,
  endDate,
  onChange,
}: TimeRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startDate,
    to: endDate,
  });

  const handleRangeChange = (range: TimeRange) => {
    if (range === 'custom') {
      setIsCalendarOpen(true);
      return;
    }

    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (range) {
      case 'today':
        start = startOfDay(now);
        end = now;
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = startOfDay(now);
        break;
      case 'week':
        start = startOfDay(subWeeks(now, 1));
        end = now;
        break;
      case 'month':
        start = startOfDay(subMonths(now, 1));
        end = now;
        break;
      case 'quarter':
        start = startOfDay(subMonths(now, 3));
        end = now;
        break;
      case 'year':
        start = startOfDay(subMonths(now, 12));
        end = now;
        break;
    }

    onChange(range, start, end);
  };

  const handleDateSelect = (dates: { from: Date; to: Date }) => {
    setSelectedDates(dates);
    if (dates.from && dates.to) {
      onChange('custom', dates.from, addDays(dates.to, 1));
      setIsCalendarOpen(false);
    }
  };

  const formatDateRange = () => {
    if (value === 'custom' && startDate && endDate) {
      return `${format(startDate, 'MMM d, yyyy')} - ${format(
        subDays(endDate, 1),
        'MMM d, yyyy'
      )}`;
    }

    switch (value) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'week':
        return 'Last 7 days';
      case 'month':
        return 'Last 30 days';
      case 'quarter':
        return 'Last 90 days';
      case 'year':
        return 'Last 365 days';
      default:
        return 'Select date range';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={value} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="week">Last 7 days</SelectItem>
          <SelectItem value="month">Last 30 days</SelectItem>
          <SelectItem value="quarter">Last 90 days</SelectItem>
          <SelectItem value="year">Last 365 days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-[280px] justify-start text-left font-normal ${
              !value && 'text-muted-foreground'
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={startDate}
            selected={selectedDates}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 