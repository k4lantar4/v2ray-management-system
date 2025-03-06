/// <reference types="react" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
    }
  }
}

declare module 'stylis-plugin-rtl';
declare module 'next-intl';
declare module 'notistack';

declare module '@mui/material/styles' {
  interface Theme {
    palette: {
      primary: { main: string };
      secondary: { main: string };
      error: { main: string };
      warning: { main: string };
      info: { main: string };
      success: { main: string };
    };
  }
}

interface LayoutProps {
  children: React.ReactNode;
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

export {};
