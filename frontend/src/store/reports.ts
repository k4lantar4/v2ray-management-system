import { create } from 'zustand';
import { api } from '@/lib/api';

interface ReportFilter {
  startDate?: string;
  endDate?: string;
  type?: 'financial' | 'user' | 'subscription' | 'server' | 'traffic';
  format?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  groupBy?: string[];
  metrics?: string[];
}

interface ReportMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
}

interface ReportData {
  metrics: ReportMetric[];
  charts: {
    type: 'line' | 'bar' | 'pie';
    title: string;
    description?: string;
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
      }[];
    };
  }[];
  tables: {
    title: string;
    description?: string;
    columns: { key: string; label: string }[];
    rows: Record<string, any>[];
  }[];
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  includeTables?: boolean;
  selectedMetrics?: string[];
}

interface ReportsState {
  data: ReportData | null;
  isLoading: boolean;
  error: string | null;
  currentFilter: ReportFilter;
  
  // Actions
  getReport: (filter: ReportFilter) => Promise<void>;
  exportReport: (options: ExportOptions) => Promise<string>;
  scheduleReport: (filter: ReportFilter, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    emails: string[];
    format: ExportOptions['format'];
  }) => Promise<void>;
}

const defaultFilter: ReportFilter = {
  type: 'financial',
  format: 'monthly',
  groupBy: ['date'],
  metrics: ['revenue', 'orders', 'average_order_value'],
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  currentFilter: defaultFilter,

  getReport: async (filter: ReportFilter) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/reports/generate', filter);
      set({
        data: response.data,
        currentFilter: filter,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  },

  exportReport: async (options: ExportOptions) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/reports/export', {
        filter: get().currentFilter,
        options,
      });
      set({ isLoading: false });
      return response.data.downloadUrl;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to export report',
      });
      throw error;
    }
  },

  scheduleReport: async (filter: ReportFilter, schedule) => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/reports/schedule', {
        filter,
        schedule,
      });
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to schedule report',
      });
      throw error;
    }
  },
})); 