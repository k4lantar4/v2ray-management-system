import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricValue } from '@/types/api';
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  description?: string;
  metric: MetricValue;
  prefix?: string;
  suffix?: string;
  previousLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function MetricCard({
  title,
  description,
  metric,
  prefix = '',
  suffix = '',
  previousLabel = 'vs. previous period',
  icon,
  onClick,
}: MetricCardProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowRightIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card
      className={onClick ? 'cursor-pointer transition-colors hover:bg-accent/5' : ''}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-2xl font-bold">
            {prefix}
            {formatValue(metric.value)}
            {suffix}
          </p>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <p className={`text-xs ${getTrendColor()}`}>
              {metric.change >= 0 ? '+' : ''}
              {metric.change}%
            </p>
            <p className="text-xs text-muted-foreground">{previousLabel}</p>
          </div>
          {description && (
            <CardDescription className="pt-2">{description}</CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 