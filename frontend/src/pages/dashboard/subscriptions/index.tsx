import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '../../../components/layout/Layout';
import { subscriptionService } from '../../../services/api';
import { useAuthGuard } from '../../../contexts/AuthContext';
import { PriceDisplay } from '../../../components/common/UserStatusChip';

const SubscriptionStatusChip = ({ status }: { status: string }) => {
  const t = useTranslations();
  const statusColors: Record<string, 'success' | 'error' | 'warning'> = {
    ACTIVE: 'success',
    EXPIRED: 'error',
    PENDING: 'warning',
  };

  return (
    <Chip
      label={t(`subscriptions.status.${status.toLowerCase()}`)}
      color={statusColors[status]}
    />
  );
};

export default function Subscriptions() {
  useAuthGuard(['ADMIN', 'SUPPORT']);
  const t = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      enqueueSnackbar(t('subscriptions.fetchError'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('subscriptions.deleteConfirm'))) {
      try {
        await subscriptionService.deleteSubscription(id);
        enqueueSnackbar(t('subscriptions.deleteSuccess'), { variant: 'success' });
        fetchSubscriptions();
      } catch (error) {
        enqueueSnackbar(t('subscriptions.deleteError'), { variant: 'error' });
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: t('subscriptions.fields.user'),
      flex: 1,
      valueGetter: (params) => params.row.user.full_name || params.row.user.phone,
    },
    {
      field: 'plan',
      headerName: t('subscriptions.fields.plan'),
      flex: 1,
    },
    {
      field: 'status',
      headerName: t('subscriptions.fields.status'),
      flex: 1,
      renderCell: (params) => <SubscriptionStatusChip status={params.value} />,
    },
    {
      field: 'start_date',
      headerName: t('subscriptions.fields.startDate'),
      flex: 1,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleDateString('fa-IR'),
    },
    {
      field: 'end_date',
      headerName: t('subscriptions.fields.endDate'),
      flex: 1,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleDateString('fa-IR'),
    },
    {
      field: 'traffic',
      headerName: t('subscriptions.fields.traffic'),
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon color="primary" />
          <Typography>
            {(params.row.traffic_limit / 1024).toFixed(1)} GB
          </Typography>
        </Box>
      ),
    },
    {
      field: 'traffic_used',
      headerName: t('subscriptions.fields.usedTraffic'),
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimerIcon color="secondary" />
          <Typography>
            {(params.row.traffic_used / 1024).toFixed(1)} GB
          </Typography>
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: t('subscriptions.fields.price'),
      flex: 1,
      renderCell: (params) => <PriceDisplay amount={params.value} />,
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      flex: 1, // Updated to a valid number
    },
  ];

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          {t('subscriptions.title')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/subscriptions/create')}
        >
          {t('subscriptions.create')}
        </Button>
      </Box>
      <DataGrid
        rows={subscriptions}
        columns={columns}
        loading={loading}
        autoHeight
    // pageSize={5} // Removed due to compatibility issues


        checkboxSelection
    disableRowSelectionOnClick

      />
    </Layout>
  );
}
