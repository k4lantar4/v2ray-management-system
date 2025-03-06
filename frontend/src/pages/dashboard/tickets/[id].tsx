import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Divider,
  Paper,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useSnackbar } from 'notistack';
import Layout from '@/components/layout/Layout';
import { ticketService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { TicketStatusChip, PriorityChip } from '@/components/common/UserStatusChip';

interface Message {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    full_name: string | null;
    phone: string;
    role: string;
  };
}

interface TicketDetails {
  id: number;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  user: {
    id: number;
    full_name: string | null;
    phone: string;
    role: string;
  };
  messages: Message[];
}

export default function TicketDetail() {
  const { user } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();

  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (id) {
      fetchTicket(Number(id));
    }
  }, [id]);

  const fetchTicket = async (ticketId: number) => {
    try {
      setLoading(true);
      const data = await ticketService.getTicket(ticketId);
      setTicket(data);
    } catch (error) {
      enqueueSnackbar(t('tickets.fetchError'), { variant: 'error' });
      router.push('/dashboard/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      setSending(true);
      await ticketService.replyToTicket(Number(id), reply);
      setReply('');
      fetchTicket(Number(id));
      enqueueSnackbar(t('tickets.replySuccess'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('tickets.replyError'), { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return (
      <Layout title={t('tickets.loading')}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={ticket.subject}>
      <Box mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/tickets')}
        >
          {t('common.back')}
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {ticket.subject}
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Avatar sx={{ width: 24, height: 24 }}>
                  {ticket.user.full_name?.[0] || ticket.user.phone[0]}
                </Avatar>
                <Typography variant="body2">
                  {ticket.user.full_name || ticket.user.phone}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <TicketStatusChip status={ticket.status} />
                <PriorityChip priority={ticket.priority} />
                <Typography variant="body2">
                  {new Date(ticket.created_at).toLocaleDateString('fa-IR')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box mb={3}>
        {ticket.messages.map((message) => (
          <Paper
            key={message.id}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: message.user.id === user?.id ? 'primary.light' : 'background.paper',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Avatar sx={{ width: 24, height: 24 }}>
                {message.user.full_name?.[0] || message.user.phone[0]}
              </Avatar>
              <Typography variant="body2" fontWeight="bold">
                {message.user.full_name || message.user.phone}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(message.created_at).toLocaleString('fa-IR')}
              </Typography>
            </Box>
            <Typography variant="body1" whiteSpace="pre-wrap">
              {message.content}
            </Typography>
          </Paper>
        ))}
      </Box>

      {ticket.status !== 'CLOSED' && (
        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSendReply}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t('tickets.replyPlaceholder')}
                disabled={sending}
              />
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={sending || !reply.trim()}
                >
                  {sending ? t('common.sending') : t('tickets.reply')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
