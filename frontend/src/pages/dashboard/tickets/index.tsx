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
import Avatar from '@mui/material/Avatar';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import ReplyIcon from '@mui/icons-material/Reply';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '../../../components/layout/Layout';
import { ticketService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export const TicketStatusChip = ({ status }: { status: string }) => {
  const t = useTranslations();
  const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    OPEN: 'info',
    CLOSED: 'error',
    PENDING: 'warning',
    ANSWERED: 'success',
  };

  return (
    <Chip
      label={t(`tickets.status.${status.toLowerCase()}`)}
      color={statusColors[status]}
    />
  );
};

export const PriorityChip = ({ priority }: { priority: string }) => {
  const t = useTranslations();
  const priorityColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info',
    URGENT: 'error',
  };

  return (
    <Chip
      label={t(`tickets.priority.${priority.toLowerCase()}`)}
      color={priorityColors[priority]}
      size="small"
    />
  );
};

export default function Tickets() {
  const { user } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTickets();
      setTickets(data);
    } catch (error) {
      enqueueSnackbar(t('tickets.fetchError'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async (id: number) => {
    if (window.confirm(t('tickets.closeConfirm'))) {
      try {
        await ticketService.closeTicket(id);
        enqueueSnackbar(t('tickets.closeSuccess'), { variant: 'success' });
        fetchTickets();
      } catch (error) {
        enqueueSnackbar(t('tickets.closeError'), { variant: 'error' });
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'subject',
      headerName: t('tickets.fields.subject'),
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon color="action" />
          <Typography>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'user',
      headerName: t('tickets.fields.user'),
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 24, height: 24 }}>
            {params.row.user.full_name?.[0] || params.row.user.phone[0]}
          </Avatar>
          <Typography>{params.row.user.full_name || params.row.user.phone}</Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: t('tickets.fields.status'),
      flex: 1,
      renderCell: (params) => <TicketStatusChip status={params.value} />,
    },
    {
      field: 'priority',
      headerName: t('tickets.fields.priority'),
      flex: 1,
      renderCell: (params) => <PriorityChip priority={params.value} />,
    },
    {
      field: 'created_at',
      headerName: t('tickets.fields.createdAt'),
      flex: 1,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleDateString('fa-IR'),
    },
    {
      field: 'last_update',
      headerName: t('tickets.fields.lastUpdate'),
      flex: 1,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleDateString('fa-IR'),
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
            onClick={() => router.push(`/dashboard/tickets/${params.row.id}`)}
          >
            <ReplyIcon />
          </IconButton>
          {(user?.role === 'ADMIN' || user?.role === 'SUPPORT') && (
            <IconButton
              color="error"
              onClick={() => handleCloseTicket(params.row.id)}
              disabled={params.row.status === 'CLOSED'}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Layout title={t('tickets.title')}>
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
                onClick={() => router.push('/dashboard/tickets/create')}
              >
                {t('tickets.create')}
              </Button>
            </Grid>
          </Grid>

          <DataGrid
            rows={tickets}
            columns={columns}
            loading={loading}
            autoHeight
            pagination
            disableRowSelectionOnClick
            sx={{ direction: 'rtl' }}
          />
        </CardContent>
      </Card>
    </Layout>
  );
}
