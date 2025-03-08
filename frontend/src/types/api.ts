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