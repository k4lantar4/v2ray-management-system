import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '../../../components/layout/Layout';
import { subscriptionService, userService } from '../../../services/api';
import { useAuthGuard } from '../../../contexts/AuthContext';

interface SubscriptionFormData {
  user_id: number;
  plan: string;
  start_date: string;
  end_date: string;
  traffic_limit: number;
  price: number;
  status: string;
}

interface User {
  id: number;
  phone: string;
  full_name: string | null;
}

const plans = [
  { id: 'BASIC', traffic: 50 },
  { id: 'STANDARD', traffic: 100 },
  { id: 'PREMIUM', traffic: 200 },
  { id: 'UNLIMITED', traffic: 500 },
];

export default function SubscriptionForm() {
  useAuthGuard(['ADMIN', 'SUPPORT']);
  const t = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { action, id } = router.query;
  const isEdit = action === 'edit';

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<SubscriptionFormData>({
    user_id: 0,
    plan: 'BASIC',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    traffic_limit: 50,
    price: 0,
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchUsers();
    if (isEdit && id) {
      fetchSubscription(Number(id));
    }
  }, [isEdit, id]);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      enqueueSnackbar(t('users.fetchError'), { variant: 'error' });
    }
  };

  const fetchSubscription = async (subscriptionId: number) => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscription(subscriptionId);
      setFormData({
        user_id: data.user_id,
        plan: data.plan,
        start_date: data.start_date,
        end_date: data.end_date,
        traffic_limit: data.traffic_limit,
        price: data.price,
        status: data.status,
      });
      const user = users.find(u => u.id === data.user_id);
      if (user) setSelectedUser(user);
    } catch (error) {
      enqueueSnackbar(t('subscriptions.fetchError'), { variant: 'error' });
      router.push('/dashboard/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit) {
        await subscriptionService.updateSubscription(Number(id), formData);
        enqueueSnackbar(t('subscriptions.updateSuccess'), { variant: 'success' });
      } else {
        await subscriptionService.createSubscription(formData);
        enqueueSnackbar(t('subscriptions.createSuccess'), { variant: 'success' });
      }
      router.push('/dashboard/subscriptions');
    } catch (error) {
      enqueueSnackbar(
        isEdit ? t('subscriptions.updateError') : t('subscriptions.createError'),
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserChange = (_event: React.SyntheticEvent, newValue: User | null) => {
    setSelectedUser(newValue);
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        user_id: newValue.id,
      }));
    }
  };

  const handlePlanChange = (e: SelectChangeEvent<string>) => {
    const plan = plans.find(p => p.id === e.target.value);
    if (plan) {
      setFormData(prev => ({
        ...prev,
        plan: plan.id,
        traffic_limit: plan.traffic,
      }));
    }
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value,
    }));
  };

  if (loading && isEdit) {
    return (
      <Layout title={t('subscriptions.loading')}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? t('subscriptions.edit') : t('subscriptions.add')}>
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={users}
                  value={selectedUser}
                  onChange={handleUserChange}
                  getOptionLabel={(option) => option.full_name || option.phone}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label={t('subscriptions.fields.user')}
                    />
                  )}
                  disabled={isEdit}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('subscriptions.fields.plan')}</InputLabel>
                  <Select
                    name="plan"
                    value={formData.plan}
                    onChange={handlePlanChange}
                    label={t('subscriptions.fields.plan')}
                  >
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {t(`subscriptions.plans.${plan.id.toLowerCase()}`)} ({plan.traffic} GB)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label={t('subscriptions.fields.startDate')}
                  value={new Date(formData.start_date)}
                  onChange={(date) =>
                    setFormData(prev => ({
                      ...prev,
                      start_date: date?.toISOString() || new Date().toISOString(),
                    }))
                  }
                  renderInput={(params) => <TextField {...params} />}
                />

              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label={t('subscriptions.fields.endDate')}
                  value={new Date(formData.end_date)}
                  onChange={(date) =>
                    setFormData(prev => ({
                      ...prev,
                      end_date: date?.toISOString() || new Date().toISOString(),
                    }))
                  }
                  renderInput={(params) => <TextField {...params} />}
                />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="price"
                  label={t('subscriptions.fields.price')}
                  value={formData.price}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: <Typography>ریال</Typography>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('subscriptions.fields.status')}</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    label={t('subscriptions.fields.status')}
                  >
                    <MenuItem value="ACTIVE">{t('subscriptions.status.active')}</MenuItem>
                    <MenuItem value="EXPIRED">{t('subscriptions.status.expired')}</MenuItem>
                    <MenuItem value="PENDING">{t('subscriptions.status.pending')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/dashboard/subscriptions')}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : isEdit ? (
                      t('common.save')
                    ) : (
                      t('common.create')
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Layout>
  );
}
