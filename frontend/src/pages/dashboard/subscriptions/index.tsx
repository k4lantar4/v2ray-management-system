import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '@/components/layout/Layout';
import { subscriptionService } from '@/services/api';
import { useAuthGuard } from '@/contexts/AuthContext';
import { PriceDisplay } from '@/components/common/UserStatusChip';

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
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() =>
              router.push(`/dashboard/subscriptions/edit/${params.row.id}`)
            }
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Layout title={t('subscriptions.title')}>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/dashboard/subscriptions/create')}
              >
                {t('subscriptions.add')}
              </Button>
            </Grid>
          </Grid>

          <DataGrid
            rows={subscriptions}
            columns={columns}
            loading={loading}
            autoHeight
            pagination
            disableSelectionOnClick
            sx={{ direction: 'rtl' }}
          />
        </CardContent>
      </Card>
    </Layout>
  );
}
