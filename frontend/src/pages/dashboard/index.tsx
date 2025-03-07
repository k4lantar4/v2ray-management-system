import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PeopleIcon from '@mui/icons-material/People';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import StorageIcon from '@mui/icons-material/Storage';
import AddIcon from '@mui/icons-material/Add';
import { useTranslations } from 'next-intl';
import Layout from '../../components/layout/Layout';

// کامپوننت کارت آمار
const StatCard = ({ title, value, icon, loading = false }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" component="div" sx={{ mr: 1 }}>
          {title}
        </Typography>
      </Box>
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// کامپوننت کارت دسترسی سریع
const QuickActionCard = ({ title, icon, onClick }: any) => (
  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={onClick}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {icon}
        <Typography variant="body1" component="div" sx={{ mt: 1 }}>
          {title}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    activeServers: 0,
  });

  useEffect(() => {
    // TODO: Fetch dashboard stats from API
    const fetchStats = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStats({
          totalUsers: 150,
          activeSubscriptions: 85,
          totalRevenue: 12500000,
          activeServers: 5,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: t('dashboard.quickActions.addUser'),
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      onClick: () => {/* TODO: Navigate to add user */},
    },
    {
      title: t('dashboard.quickActions.addSubscription'),
      icon: <SubscriptionsIcon sx={{ fontSize: 40 }} />,
      onClick: () => {/* TODO: Navigate to add subscription */},
    },
    {
      title: t('dashboard.quickActions.createTicket'),
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      onClick: () => {/* TODO: Navigate to create ticket */},
    },
    {
      title: t('dashboard.quickActions.serverStatus'),
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
      onClick: () => {/* TODO: Navigate to server status */},
    },
  ];

  return (
    <Layout title={t('dashboard.title')}>
      <Grid container spacing={3}>
        {/* آمار کلی */}
        <Grid item xs={12} md={3}>
          <StatCard
            title={t('dashboard.stats.totalUsers')}
            value={stats.totalUsers.toLocaleString('fa-IR')}
            icon={<PeopleIcon color="primary" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title={t('dashboard.stats.activeSubscriptions')}
            value={stats.activeSubscriptions.toLocaleString('fa-IR')}
            icon={<SubscriptionsIcon color="primary" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title={t('dashboard.stats.totalRevenue')}
            value={`${stats.totalRevenue.toLocaleString('fa-IR')} ریال`}
            icon={<MoneyIcon color="primary" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title={t('dashboard.stats.activeServers')}
            value={stats.activeServers.toLocaleString('fa-IR')}
            icon={<StorageIcon color="primary" />}
            loading={loading}
          />
        </Grid>

        {/* دسترسی‌های سریع */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.quickActions.title')}
          </Typography>
        </Grid>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <QuickActionCard {...action} />
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
