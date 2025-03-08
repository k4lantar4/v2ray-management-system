import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Line } from 'react-chartjs-2';
import { ArrowDown, ArrowRight, ArrowUp, HelpCircle } from 'lucide-react';

interface ReportMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
}

interface ReportMetricsProps {
  metrics: ReportMetric[];
}

export function ReportMetrics({ metrics }: ReportMetricsProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  const getTrendIcon = (trend: ReportMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: ReportMetric['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getChartData = (metric: ReportMetric) => ({
    labels: metric.history.map((h) => new Date(h.date).toLocaleDateString()),
    datasets: [
      {
        label: metric.name,
        data: metric.history.map((h) => h.value),
        fill: false,
        borderColor: metric.trend === 'up' ? '#22c55e' : metric.trend === 'down' ? '#ef4444' : '#6b7280',
        tension: 0.4,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.name}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-medium">
                  {metric.name}
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Historical trend for {metric.name.toLowerCase()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge
                variant={metric.trend === 'stable' ? 'outline' : 'default'}
                className={getTrendColor(metric.trend)}
              >
                {getTrendIcon(metric.trend)}
                <span className="ml-1">
                  {metric.change >= 0 ? '+' : ''}
                  {metric.change}%
                </span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatValue(metric.value)}
              </div>
              <div className="h-16">
                <Line data={getChartData(metric)} options={chartOptions} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 