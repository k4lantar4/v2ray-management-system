import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  AnalyticsFilter,
  DashboardMetrics,
  RevenueAnalytics,
  UserAnalytics,
  MarketingInsights,
  AIRecommendations,
} from '@/types/api';

interface AnalyticsState {
  metrics: DashboardMetrics;
  revenueData: RevenueAnalytics;
  userAnalytics: UserAnalytics;
  marketingInsights: MarketingInsights;
  aiRecommendations: AIRecommendations;
  isLoading: boolean;
  error: string | null;
  getAnalytics: (filter: AnalyticsFilter) => Promise<void>;
  applyRecommendation: (action: string, data: any) => Promise<void>;
}

const initialMetrics: DashboardMetrics = {
  totalRevenue: { value: 0, change: 0, trend: 'stable' },
  newUsers: { value: 0, change: 0, trend: 'stable' },
  activeSubscriptions: { value: 0, change: 0, trend: 'stable' },
  averageOrderValue: { value: 0, change: 0, trend: 'stable' },
  userRetentionRate: { value: 0, change: 0, trend: 'stable' },
  churnRate: { value: 0, change: 0, trend: 'stable' },
};

const initialRevenueData: RevenueAnalytics = {
  total: { value: 0, change: 0, trend: 'stable' },
  byPlan: {},
  byPeriod: { labels: [], datasets: [] },
  projectedRevenue: { value: 0, change: 0, trend: 'stable' },
  recurringRevenue: { value: 0, change: 0, trend: 'stable' },
};

const initialUserAnalytics: UserAnalytics = {
  total: { value: 0, change: 0, trend: 'stable' },
  active: { value: 0, change: 0, trend: 'stable' },
  byRole: {
    admin: { value: 0, change: 0, trend: 'stable' },
    seller: { value: 0, change: 0, trend: 'stable' },
    customer: { value: 0, change: 0, trend: 'stable' },
  },
  acquisitionChannels: [],
  retentionCohorts: [],
};

const initialMarketingInsights: MarketingInsights = {
  customerSegments: [],
  promotionalCampaigns: [],
  contentPerformance: [],
};

const initialAIRecommendations: AIRecommendations = {
  userSegmentation: [],
  contentSuggestions: [],
  pricingOptimization: [],
  retentionStrategies: [],
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  metrics: initialMetrics,
  revenueData: initialRevenueData,
  userAnalytics: initialUserAnalytics,
  marketingInsights: initialMarketingInsights,
  aiRecommendations: initialAIRecommendations,
  isLoading: false,
  error: null,

  getAnalytics: async (filter: AnalyticsFilter) => {
    try {
      set({ isLoading: true, error: null });

      const [
        metrics,
        revenueData,
        userAnalytics,
        marketingInsights,
        aiRecommendations,
      ] = await Promise.all([
        api.get('/analytics/metrics', { params: filter }),
        api.get('/analytics/revenue', { params: filter }),
        api.get('/analytics/users', { params: filter }),
        api.get('/analytics/marketing', { params: filter }),
        api.get('/analytics/ai-insights', { params: filter }),
      ]);

      set({
        metrics: metrics.data,
        revenueData: revenueData.data,
        userAnalytics: userAnalytics.data,
        marketingInsights: marketingInsights.data,
        aiRecommendations: aiRecommendations.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics',
      });
    }
  },

  applyRecommendation: async (action: string, data: any) => {
    try {
      await api.post(`/analytics/recommendations/${action}`, data);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to apply recommendation'
      );
    }
  },
})); 