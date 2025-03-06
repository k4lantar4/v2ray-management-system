import { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '@/components/layout/Layout';
import { userService } from '@/services/api';
import { useAuthGuard } from '@/contexts/AuthContext';

export default function Users() {
  useAuthGuard(['ADMIN']);
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      enqueueSnackbar('خطا در دریافت لیست کاربران', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('users.deleteConfirm'))) {
      try {
        await userService.deleteUser(id);
        enqueueSnackbar(t('users.deleteSuccess'), { variant: 'success' });
        fetchUsers();
      } catch (error) {
        enqueueSnackbar(t('users.deleteError'), { variant: 'error' });
      }
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'phone',
      headerName: t('users.fields.phone'),
      flex: 1,
    },
    {
      field: 'full_name',
      headerName: t('users.fields.fullName'),
      flex: 1,
    },
    {
      field: 'role',
      headerName: t('users.fields.role'),
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={t(`users.roles.${params.value.toLowerCase()}`)}
          color={params.value === 'ADMIN' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'status',
      headerName: t('users.fields.status'),
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={t(`users.status.${params.value.toLowerCase()}`)}
          color={
            params.value === 'ACTIVE'
              ? 'success'
              : params.value === 'BLOCKED'
              ? 'error'
              : 'warning'
          }
        />
      ),
    },
    {
      field: 'wallet_balance',
      headerName: t('users.fields.walletBalance'),
      flex: 1,
      renderCell: (params) => (
        <Typography>
          {params.value.toLocaleString('fa-IR')} ریال
        </Typography>
      ),
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
            onClick={() => router.push(`/dashboard/users/edit/${params.row.id}`)}
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
    <Layout title={t('users.title')}>
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
                onClick={() => router.push('/dashboard/users/create')}
              >
                {t('users.add')}
              </Button>
            </Grid>
          </Grid>

          <DataGrid
            rows={users}
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
