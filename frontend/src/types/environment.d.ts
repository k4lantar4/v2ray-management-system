declare module 'react' {
  export * from '@types/react';
}

declare module 'next/router' {
  export * from 'next/dist/client/router';
}

declare module '@mui/material' {
  export * from '@mui/material';
  export interface SelectChangeEvent<T = string> {
    target: {
      value: T;
      name: string;
    };
  }
}

declare module '@mui/x-date-pickers' {
  export interface DatePickerProps<TDate = Date> {
    label?: React.ReactNode;
    value: TDate | null;
    onChange: (value: TDate | null) => void;
  }
  export const DatePicker: React.FC<DatePickerProps>;
}

declare module 'next-intl' {
  export function useTranslations(): (key: string) => string;
}

declare module 'notistack' {
  export interface SnackbarProps {
    variant?: 'default' | 'error' | 'success' | 'warning' | 'info';
  }
  export function useSnackbar(): {
    enqueueSnackbar: (message: string, options?: SnackbarProps) => void;
  };
}

declare module 'stylis-plugin-rtl' {
  const rtlPlugin: any;
  export default rtlPlugin;
}

declare module 'stylis' {
  export const prefixer: any;
}

declare module '@/components/layout/Layout' {
  interface LayoutProps {
    children: React.ReactNode;
    title: string;
  }
  const Layout: React.FC<LayoutProps>;
  export default Layout;
}

declare module '@/services/api' {
  export const subscriptionService: {
    getSubscription: (id: number) => Promise<any>;
    createSubscription: (data: any) => Promise<any>;
    updateSubscription: (id: number, data: any) => Promise<any>;
  };
  export const userService: {
    getUsers: () => Promise<any>;
  };
}

declare module '@/contexts/AuthContext' {
  export function useAuthGuard(roles: string[]): void;
}
