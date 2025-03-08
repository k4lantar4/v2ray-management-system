'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { MetricCard } from '@/components/analytics/MetricCard';
import { AIInsightsCard } from '@/components/analytics/AIInsightsCard';
import { TimeRangeFilter } from '@/components/analytics/TimeRangeFilter';
import { TimeRange } from '@/types/api';
import {
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  UserCheck,
  UserMinus,
} from 'lucide-react';

export default function AnalyticsPage() {
  const {
    metrics,
    revenueData,
    userAnalytics,
    marketingInsights,
    aiRecommendations,
    isLoading,
    error,
    getAnalytics,
    applyRecommendation,
  } = useAnalyticsStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, startDate, endDate]);

  const loadAnalytics = () => {
    getAnalytics({
      timeRange,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  };

  const handleTimeRangeChange = (range: TimeRange, start?: Date, end?: Date) => {
    setTimeRange(range);
    setStartDate(start);
    setEndDate(end);
  };

  const handleApplyRecommendation = async (action: string, data: any) => {
    try {
      await applyRecommendation(action, data);
      loadAnalytics();
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    }
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Monitor your business performance and get AI-powered recommendations
        </p>
      </div>

      <TimeRangeFilter
        value={timeRange}
        startDate={startDate}
        endDate={endDate}
        onChange={handleTimeRangeChange}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Revenue"
          metric={metrics.totalRevenue}
          prefix="$"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="New Users"
          metric={metrics.newUsers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Subscriptions"
          metric={metrics.activeSubscriptions}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Average Order Value"
          metric={metrics.averageOrderValue}
          prefix="$"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="User Retention"
          metric={metrics.userRetentionRate}
          suffix="%"
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Churn Rate"
          metric={metrics.churnRate}
          suffix="%"
          icon={<UserMinus className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsChart
          title="Revenue Over Time"
          type="area"
          data={revenueData.byPeriod}
          metric={revenueData.total}
          loading={isLoading}
        />
        <AnalyticsChart
          title="User Acquisition"
          type="bar"
          data={{
            labels: userAnalytics.acquisitionChannels.map((c) => c.channel),
            datasets: [
              {
                label: 'New Users',
                data: userAnalytics.acquisitionChannels.map((c) => c.users),
                backgroundColor: [
                  'rgba(59, 130, 246, 0.5)', // blue
                  'rgba(16, 185, 129, 0.5)', // green
                  'rgba(249, 115, 22, 0.5)', // orange
                  'rgba(139, 92, 246, 0.5)', // purple
                ],
              },
              {
                label: 'Conversion Rate',
                data: userAnalytics.acquisitionChannels.map((c) => c.conversion),
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(16, 185, 129, 0.8)',
                  'rgba(249, 115, 22, 0.8)',
                  'rgba(139, 92, 246, 0.8)',
                ],
              },
            ],
          }}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart
          title="User Retention Cohorts"
          description="User retention rates by cohort over time"
          type="line"
          data={{
            labels: userAnalytics.retentionCohorts[0]?.retentionRates.map(
              (_, i) => `Week ${i + 1}`
            ),
            datasets: userAnalytics.retentionCohorts.map((cohort) => ({
              label: cohort.cohort,
              data: cohort.retentionRates,
              borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
            })),
          }}
          loading={isLoading}
        />
        <AnalyticsChart
          title="Revenue by Plan"
          description="Revenue distribution across different plans"
          type="pie"
          data={{
            labels: Object.keys(revenueData.byPlan),
            datasets: [
              {
                data: Object.values(revenueData.byPlan).map((p) => p.value),
                backgroundColor: [
                  'rgba(59, 130, 246, 0.5)',
                  'rgba(16, 185, 129, 0.5)',
                  'rgba(249, 115, 22, 0.5)',
                  'rgba(139, 92, 246, 0.5)',
                ],
              },
            ],
          }}
          loading={isLoading}
        />
      </div>

      <AIInsightsCard data={aiRecommendations} onApply={handleApplyRecommendation} />
    </div>
  );
} 