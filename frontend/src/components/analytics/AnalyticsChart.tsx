import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData, ChartType, MetricValue } from '@/types/api';
import { Loader2 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsChartProps {
  title: string;
  description?: string;
  type: ChartType;
  data: ChartData;
  metric?: MetricValue;
  height?: number;
  loading?: boolean;
  error?: string;
}

export function AnalyticsChart({
  title,
  description,
  type,
  data,
  metric,
  height = 300,
  loading = false,
  error,
}: AnalyticsChartProps) {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    // Update chart on data change
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [data]);

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
    };

    switch (type) {
      case 'area':
        return {
          ...baseOptions,
          elements: {
            line: {
              tension: 0.4,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            ...baseOptions.plugins,
            filler: {
              propagate: true,
            },
          },
        };

      case 'radar':
        return {
          ...baseOptions,
          scales: {
            r: {
              beginAtZero: true,
            },
          },
        };

      default:
        return baseOptions;
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    const chartProps = {
      data,
      options: getChartOptions(),
      ref: chartRef,
    };

    switch (type) {
      case 'line':
        return <Chart type="line" {...chartProps} />;
      case 'bar':
        return <Chart type="bar" {...chartProps} />;
      case 'pie':
        return <Chart type="pie" {...chartProps} />;
      case 'area':
        return <Chart type="line" {...chartProps} />;
      case 'radar':
        return <Chart type="radar" {...chartProps} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {metric && (
            <div className="text-right">
              <p className="text-2xl font-bold">{metric.value}</p>
              <p
                className={`text-sm ${
                  metric.trend === 'up'
                    ? 'text-green-600'
                    : metric.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {metric.change >= 0 ? '+' : ''}
                {metric.change}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>{renderChart()}</div>
      </CardContent>
    </Card>
  );
} 