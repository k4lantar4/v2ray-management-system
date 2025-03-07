import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import SupportIcon from '@mui/icons-material/Support';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
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
    icon: <LocalOfferIcon />,
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
