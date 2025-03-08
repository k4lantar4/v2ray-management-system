import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

interface ReportFilter {
  startDate?: string;
  endDate?: string;
  type?: 'financial' | 'user' | 'subscription' | 'server' | 'traffic';
  format?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  groupBy?: string[];
  metrics?: string[];
}

interface ReportFilterProps {
  filter: ReportFilter;
  onFilterChange: (filter: ReportFilter) => void;
  onGenerateReport: () => void;
  isLoading?: boolean;
}

const reportTypes = [
  { value: 'financial', label: 'Financial Reports' },
  { value: 'user', label: 'User Analytics' },
  { value: 'subscription', label: 'Subscription Reports' },
  { value: 'server', label: 'Server Statistics' },
  { value: 'traffic', label: 'Traffic Analysis' },
];

const timeFormats = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const groupByOptions = [
  { value: 'date', label: 'Date' },
  { value: 'user_role', label: 'User Role' },
  { value: 'plan', label: 'Subscription Plan' },
  { value: 'server', label: 'Server' },
  { value: 'status', label: 'Status' },
];

const metricOptions = {
  financial: [
    { value: 'revenue', label: 'Total Revenue' },
    { value: 'orders', label: 'Number of Orders' },
    { value: 'average_order_value', label: 'Average Order Value' },
    { value: 'mrr', label: 'Monthly Recurring Revenue' },
  ],
  user: [
    { value: 'new_users', label: 'New Users' },
    { value: 'active_users', label: 'Active Users' },
    { value: 'churn_rate', label: 'Churn Rate' },
    { value: 'retention_rate', label: 'Retention Rate' },
  ],
  subscription: [
    { value: 'active_subscriptions', label: 'Active Subscriptions' },
    { value: 'expired_subscriptions', label: 'Expired Subscriptions' },
    { value: 'renewal_rate', label: 'Renewal Rate' },
    { value: 'upgrade_rate', label: 'Upgrade Rate' },
  ],
  server: [
    { value: 'cpu_usage', label: 'CPU Usage' },
    { value: 'memory_usage', label: 'Memory Usage' },
    { value: 'bandwidth_usage', label: 'Bandwidth Usage' },
    { value: 'active_connections', label: 'Active Connections' },
  ],
  traffic: [
    { value: 'total_traffic', label: 'Total Traffic' },
    { value: 'peak_traffic', label: 'Peak Traffic' },
    { value: 'average_speed', label: 'Average Speed' },
    { value: 'data_transfer', label: 'Data Transfer' },
  ],
};

export function ReportFilter({
  filter,
  onFilterChange,
  onGenerateReport,
  isLoading = false,
}: ReportFilterProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filter.startDate ? new Date(filter.startDate) : undefined,
    to: filter.endDate ? new Date(filter.endDate) : undefined,
  });

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
    onFilterChange({
      ...filter,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
    });
  };

  const handleTypeChange = (type: ReportFilter['type']) => {
    onFilterChange({
      ...filter,
      type,
      metrics: [], // Reset metrics when type changes
    });
  };

  const handleMetricToggle = (metric: string) => {
    const metrics = filter.metrics || [];
    const newMetrics = metrics.includes(metric)
      ? metrics.filter((m) => m !== metric)
      : [...metrics, metric];
    onFilterChange({ ...filter, metrics: newMetrics });
  };

  const handleGroupByToggle = (group: string) => {
    const groups = filter.groupBy || [];
    const newGroups = groups.includes(group)
      ? groups.filter((g) => g !== group)
      : [...groups, group];
    onFilterChange({ ...filter, groupBy: newGroups });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={filter.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Format</label>
              <Select
                value={filter.format}
                onValueChange={(format) => onFilterChange({ ...filter, format })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={onGenerateReport}
                disabled={isLoading}
              >
                <Filter className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group By</label>
              <div className="flex flex-wrap gap-2">
                {groupByOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={
                      filter.groupBy?.includes(option.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleGroupByToggle(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {filter.type && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Metrics</label>
                <div className="flex flex-wrap gap-2">
                  {metricOptions[filter.type].map((metric) => (
                    <Badge
                      key={metric.value}
                      variant={
                        filter.metrics?.includes(metric.value)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => handleMetricToggle(metric.value)}
                    >
                      {metric.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 