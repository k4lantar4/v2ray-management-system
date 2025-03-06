declare module 'stylis-plugin-rtl';
declare module 'next-intl';
declare module 'notistack';

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
