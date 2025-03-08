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
export interface User {
  id: ID;
  username: string;
  email: string;
  telegramId: string;
  credit: number;
  status: Status;
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
  duration: number;
  bandwidth: number;
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