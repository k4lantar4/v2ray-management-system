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
import { DatePicker } from '@mui/x-date-pickers';
import { parseISO, isAfter, startOfDay } from 'date-fns';

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
  const [fetchingUsers, setFetchingUsers] = useState(false);
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
  }, []); // Fetch users on mount

  useEffect(() => {
    if (isEdit && id && users.length > 0) {
      fetchSubscription(Number(id));
    }
  }, [isEdit, id, users]); // Fetch subscription after users are loaded

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      enqueueSnackbar(t('users.fetchError'), { variant: 'error' });
    } finally {
      setFetchingUsers(false);
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

  const validateDates = () => {
    try {
      const startDate = startOfDay(parseISO(formData.start_date));
      const endDate = startOfDay(parseISO(formData.end_date));
      return !isAfter(startDate, endDate);
    } catch (error) {
      return false;
    }
  };

  const validateForm = () => {
    if (!formData.user_id) {
      enqueueSnackbar(t('subscriptions.errors.userRequired'), { variant: 'error' });
      return false;
    }
    if (!validateDates()) {
      enqueueSnackbar(t('subscriptions.errors.invalidDates'), { variant: 'error' });
      return false;
    }
    if (formData.price < 0 || isNaN(formData.price)) {
      enqueueSnackbar(t('subscriptions.errors.invalidPrice'), { variant: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const payload = {
        ...formData,
        // Ensure dates are in UTC ISO format
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      if (isEdit) {
        await subscriptionService.updateSubscription(Number(id), payload);
        enqueueSnackbar(t('subscriptions.updateSuccess'), { variant: 'success' });
      } else {
        await subscriptionService.createSubscription(payload);
        enqueueSnackbar(t('subscriptions.createSuccess'), { variant: 'success' });
      }
      router.push('/dashboard/subscriptions');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
        (isEdit ? t('subscriptions.updateError') : t('subscriptions.createError'));
      enqueueSnackbar(errorMessage, { variant: 'error' });
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
                  loading={fetchingUsers}
                  loadingText={t('common.loading')}
                  noOptionsText={t('users.noOptions')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!formData.user_id}
                      label={t('subscriptions.fields.user')}
                      helperText={!formData.user_id && t('subscriptions.errors.userRequired')}
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
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData(prev => ({
                        ...prev,
                        start_date: startOfDay(date).toISOString(),
                      }));
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !validateDates(),
                      helperText: !validateDates() ? t('subscriptions.errors.invalidDates') : ''
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label={t('subscriptions.fields.endDate')}
                  value={new Date(formData.end_date)}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData(prev => ({
                        ...prev,
                        end_date: startOfDay(date).toISOString(),
                      }));
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !validateDates(),
                      helperText: !validateDates() ? t('subscriptions.errors.invalidDates') : ''
                    }
                  }}
                  minDate={new Date(formData.start_date)}
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
                  error={formData.price < 0 || isNaN(formData.price)}
                  helperText={
                    formData.price < 0 || isNaN(formData.price) 
                      ? t('subscriptions.errors.invalidPrice') 
                      : ''
                  }
                  InputProps={{
                    endAdornment: <Typography>ریال</Typography>,
                    inputProps: { min: 0 }
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
