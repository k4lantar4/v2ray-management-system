// Common Types
export type ID = number;
export type Status = 'active' | 'inactive' | 'blocked' | 'expired' | 'cancelled';

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: Status;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User Types
export type UserRole = 'admin' | 'seller' | 'customer';

export interface TelegramUser {
  id: number;
  username?: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;
}

export interface User {
  id: ID;
  email?: string;
  telegram: TelegramUser;
  role: UserRole;
  status: Status;
  credit: number;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  telegramId: string;
  password?: string;
  credit?: number;
  status?: Status;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

// Server Types
export interface Server {
  id: ID;
  name: string;
  location: string;
  ip: string;
  portRangeStart: number;
  portRangeEnd: number;
  activeUsers: number;
  load: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServerDto {
  name: string;
  location: string;
  ip: string;
  portRangeStart: number;
  portRangeEnd: number;
  status?: Status;
}

export interface UpdateServerDto extends Partial<CreateServerDto> {}

// Plan Types
export interface Plan {
  id: ID;
  name: string;
  description: string;
  price: number;
  sellerPrice?: number; // Special price for sellers
  duration: number; // in months
  bandwidth: number; // in GB
  features: string[];
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDto {
  name: string;
  description: string;
  price: number;
  duration: number;
  bandwidth: number;
  features: string[];
  status?: Status;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

// Subscription Types
export interface Subscription {
  id: ID;
  userId: ID;
  planId: ID;
  serverId: ID;
  startDate: string;
  endDate: string;
  price: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
  user?: User;
  plan?: Plan;
  server?: Server;
}

export interface CreateSubscriptionDto {
  userId: ID;
  planId: ID;
  serverId: ID;
  startDate: string;
  duration: number;
  status?: Status;
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {}

// Transaction Types
export interface Transaction {
  id: ID;
  userId: ID;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface CreateTransactionDto {
  userId: ID;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status?: Status;
}

// Auth Types
export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SellerRequest {
  id: number;
  user: User;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  createdAt: string;
  updatedAt: string;
}

// Telegram Channel Types
export interface TelegramChannel {
  id: string;
  username: string;
  title: string;
  membersCount: number;
  isAdmin: boolean;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelStats {
  id: string;
  channelId: string;
  viewsCount: number;
  messagesCount: number;
  growthRate: number;
  topPosts: ScheduledPost[];
  period: 'day' | 'week' | 'month';
}

export interface ScheduledPost {
  id: string;
  channelId: string;
  content: string;
  scheduledAt: string;
  status: 'pending' | 'published' | 'failed';
  views?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentGenerationRequest {
  topic: string;
  tone?: 'professional' | 'casual' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface GeneratedContent {
  id: string;
  topic: string;
  content: string;
  hashtags?: string[];
  suggestedTime?: string;
  createdAt: string;
}

// Support Group Types
export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  admins: User[];
  status: Status;
  createdAt: string;
  updatedAt: string;
}

// Dynamic Settings Types
export type SettingValueType = 'boolean' | 'string' | 'number' | 'json' | 'array';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  type: SettingValueType;
  category: string;
  description: string;
  isEnabled: boolean;
  requiresRestart: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  settings: SystemSetting[];
  features: FeatureFlag[];
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingDto {
  value?: any;
  isEnabled?: boolean;
}

export interface UpdateFeatureDto {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  roles?: UserRole[];
}

export interface UpdateModuleDto {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  order?: number;
}

// Analytics Types
export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'radar';

export interface AnalyticsFilter {
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  userRole?: UserRole;
  status?: Status;
  groupBy?: string;
}

export interface MetricValue {
  value: number;
  change: number; // Percentage change from previous period
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardMetrics {
  totalRevenue: MetricValue;
  newUsers: MetricValue;
  activeSubscriptions: MetricValue;
  averageOrderValue: MetricValue;
  userRetentionRate: MetricValue;
  churnRate: MetricValue;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

export interface RevenueAnalytics {
  total: MetricValue;
  byPlan: { [planId: string]: MetricValue };
  byPeriod: ChartData;
  projectedRevenue: MetricValue;
  recurringRevenue: MetricValue;
}

export interface UserAnalytics {
  total: MetricValue;
  active: MetricValue;
  byRole: { [role in UserRole]: MetricValue };
  acquisitionChannels: {
    channel: string;
    users: number;
    conversion: number;
  }[];
  retentionCohorts: {
    cohort: string;
    users: number;
    retentionRates: number[];
  }[];
}

export interface MarketingInsights {
  customerSegments: {
    segment: string;
    size: number;
    averageSpend: number;
    churnRisk: 'low' | 'medium' | 'high';
    commonPlans: string[];
    recommendedActions: string[];
  }[];
  promotionalCampaigns: {
    id: string;
    name: string;
    type: 'discount' | 'referral' | 'upgrade' | 'winback';
    status: Status;
    targetSegment: string;
    metrics: {
      reach: number;
      engagement: number;
      conversion: number;
      revenue: number;
    };
    createdAt: string;
    updatedAt: string;
  }[];
  contentPerformance: {
    channelId: string;
    posts: {
      id: string;
      type: 'promotion' | 'educational' | 'announcement';
      engagement: number;
      conversion: number;
      sentiment: 'positive' | 'neutral' | 'negative';
    }[];
  }[];
}

export interface AIRecommendations {
  userSegmentation: {
    segment: string;
    characteristics: string[];
    recommendedPlans: string[];
    marketingMessages: string[];
    predictedLTV: number;
  }[];
  contentSuggestions: {
    topic: string;
    type: 'post' | 'story' | 'poll';
    targetAudience: string[];
    bestTime: string;
    predictedEngagement: number;
  }[];
  pricingOptimization: {
    planId: string;
    currentPrice: number;
    recommendedPrice: number;
    reasoning: string[];
    potentialRevenueLift: number;
  }[];
  retentionStrategies: {
    riskSegment: string;
    churnProbability: number;
    recommendedActions: {
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: number;
    }[];
  }[];
} 