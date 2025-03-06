import { SelectChangeEvent } from '@mui/material';
import { ReactNode } from 'react';

declare global {
  interface LayoutProps {
    children: ReactNode;
    title: string;
  }

  interface User {
    id: number;
    phone: string;
    full_name: string | null;
  }

  interface SubscriptionFormData {
    user_id: number;
    plan: string;
    start_date: string;
    end_date: string;
    traffic_limit: number;
    price: number;
    status: string;
  }

  interface Plan {
    id: string;
    traffic: number;
  }

  type DateChangeHandler = (date: Date | null) => void;
  type FormChangeHandler = SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>;
  type UserChangeHandler = (_event: React.SyntheticEvent, newValue: User | null) => void;
}

export {};
