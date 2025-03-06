import { useRouter } from 'next/router';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Subscriptions as SubscriptionsIcon,
  Support as SupportIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Payment as PaymentIcon,
  LocalOffer as DiscountIcon,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';

// نقش‌های کاربری و دسترسی‌های مربوطه
const roleAccess = {
  ADMIN: [
    'dashboard',
    'users',
    'subscriptions',
    'tickets',
    'servers',
    'payments',
    'discounts',
    'settings',
  ],
  SUPPORT: ['dashboard', 'tickets'],
  USER: ['dashboard', 'subscriptions', 'tickets'],
  VIP: ['dashboard', 'subscriptions', 'tickets'],
};

// آیتم‌های منو
const menuItems = [
  {
    key: 'dashboard',
    label: 'dashboard.title',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    key: 'users',
    label: 'users.title',
    icon: <PeopleIcon />,
    path: '/dashboard/users',
  },
  {
    key: 'subscriptions',
    label: 'subscriptions.title',
    icon: <SubscriptionsIcon />,
    path: '/dashboard/subscriptions',
  },
  {
    key: 'tickets',
    label: 'tickets.title',
    icon: <SupportIcon />,
    path: '/dashboard/tickets',
  },
  {
    key: 'servers',
    label: 'servers.title',
    icon: <StorageIcon />,
    path: '/dashboard/servers',
  },
  {
    key: 'payments',
    label: 'payments.title',
    icon: <PaymentIcon />,
    path: '/dashboard/payments',
  },
  {
    key: 'discounts',
    label: 'discounts.title',
    icon: <DiscountIcon />,
    path: '/dashboard/discounts',
  },
  {
    key: 'settings',
    label: 'settings.title',
    icon: <SettingsIcon />,
    path: '/dashboard/settings',
  },
];

export default function Sidebar() {
  const t = useTranslations();
  const router = useRouter();
  // TODO: Get user role from auth context
  const userRole = 'ADMIN';

  // فیلتر کردن آیتم‌های منو بر اساس نقش کاربر
  const filteredMenuItems = menuItems.filter((item) =>
    roleAccess[userRole as keyof typeof roleAccess].includes(item.key)
  );

  return (
    <Box sx={{ overflow: 'auto', pt: 8 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div" align="center" gutterBottom>
          {t('common.appName')}
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.key} disablePadding>
            <ListItemButton
              selected={router.pathname === item.path}
              onClick={() => router.push(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.label)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
