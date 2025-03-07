import { useState } from 'react';
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
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '../../../components/layout/Layout';
import { ticketService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface TicketFormData {
  subject: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export default function CreateTicket() {
  const { user } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TicketFormData>({
    subject: '',
    message: '',
    priority: 'MEDIUM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    try {
      setLoading(true);
      const response = await ticketService.createTicket(formData);
      enqueueSnackbar(t('tickets.createSuccess'), { variant: 'success' });
      router.push(`/dashboard/tickets/${response.id}`);
    } catch (error) {
      enqueueSnackbar(t('tickets.createError'), { variant: 'error' });
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

  return (
    <Layout title={t('tickets.create')}>
      <Box mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/tickets')}
        >
          {t('common.back')}
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="subject"
                  label={t('tickets.fields.subject')}
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('tickets.fields.priority')}</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleSelectChange}
                    label={t('tickets.fields.priority')}
                    disabled={loading}
                  >
                    <MenuItem value="LOW">{t('tickets.priority.low')}</MenuItem>
                    <MenuItem value="MEDIUM">{t('tickets.priority.medium')}</MenuItem>
                    <MenuItem value="HIGH">{t('tickets.priority.high')}</MenuItem>
                    <MenuItem value="URGENT">{t('tickets.priority.urgent')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={6}
                  name="message"
                  label={t('tickets.fields.message')}
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder={t('tickets.messagePlaceholder')}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/dashboard/tickets')}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    disabled={loading || !formData.subject.trim() || !formData.message.trim()}
                  >
                    {loading ? t('common.sending') : t('tickets.create')}
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
