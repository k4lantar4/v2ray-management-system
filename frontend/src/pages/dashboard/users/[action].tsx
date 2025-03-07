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
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '../../../components/layout/Layout';
import { userService } from '../../../services/api';
import { useAuthGuard } from '../../../contexts/AuthContext';

interface UserFormData {
  phone: string;
  full_name: string;
  role: string;
  status: string;
  wallet_balance: number;
  password?: string;
}

export default function UserForm() {
  useAuthGuard(['ADMIN']);
  const t = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { action, id } = router.query;
  const isEdit = action === 'edit';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    phone: '',
    full_name: '',
    role: 'USER',
    status: 'ACTIVE',
    wallet_balance: 0,
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchUser(Number(id));
    }
  }, [isEdit, id]);

  const fetchUser = async (userId: number) => {
    try {
      setLoading(true);
      const data = await userService.getUser(userId);
      setFormData({
        phone: data.phone,
        full_name: data.full_name || '',
        role: data.role,
        status: data.status,
        wallet_balance: data.wallet_balance,
      });
    } catch (error) {
      enqueueSnackbar(t('users.fetchError'), { variant: 'error' });
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit) {
        await userService.updateUser(Number(id), formData);
        enqueueSnackbar(t('users.updateSuccess'), { variant: 'success' });
      } else {
        await userService.createUser(formData);
        enqueueSnackbar(t('users.createSuccess'), { variant: 'success' });
      }
      router.push('/dashboard/users');
    } catch (error) {
      enqueueSnackbar(
        isEdit ? t('users.updateError') : t('users.createError'),
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

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading && isEdit) {
    return (
      <Layout title={t('users.loading')}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? t('users.edit') : t('users.add')}>
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  name="phone"
                  label={t('users.fields.phone')}
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isEdit}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="full_name"
                  label={t('users.fields.fullName')}
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('users.fields.role')}</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleSelectChange}
                    label={t('users.fields.role')}
                  >
                    <MenuItem value="ADMIN">{t('users.roles.admin')}</MenuItem>
                    <MenuItem value="SUPPORT">{t('users.roles.support')}</MenuItem>
                    <MenuItem value="USER">{t('users.roles.user')}</MenuItem>
                    <MenuItem value="VIP">{t('users.roles.vip')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('users.fields.status')}</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label={t('users.fields.status')}
                  >
                    <MenuItem value="ACTIVE">{t('users.status.active')}</MenuItem>
                    <MenuItem value="BLOCKED">{t('users.status.blocked')}</MenuItem>
                    <MenuItem value="PENDING">{t('users.status.pending')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="wallet_balance"
                  label={t('users.fields.walletBalance')}
                  value={formData.wallet_balance}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: <Typography>ریال</Typography>,
                  }}
                />
              </Grid>

              {!isEdit && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    name="password"
                    label={t('auth.password')}
                    onChange={handleInputChange}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/dashboard/users')}
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
