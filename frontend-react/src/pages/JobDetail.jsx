import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Button,
  Divider,
  TextField,
  LinearProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Upload as UploadIcon,
  AccountBalanceWallet as PaymentIcon,
  Event as EventIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api';

function TabPanel({ children, value, index }) {
  return value === index && <Box sx={{ py: 2 }}>{children}</Box>;
}

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setJob(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/jobs/${jobId}`, { status: newStatus });
      setJob(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const addNote = async () => {
    if (!notesInput.trim()) return;
    try {
      await api.post(`/jobs/${jobId}/notes`, { content: notesInput });
      setNotesInput('');
      fetchJob();
    } catch (err) {
      alert('Failed to add note');
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!job) return <Alert severity="info">Job not found</Alert>;

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  // Simple timeline steps based on job status
  const statusFlow = ['Pending', 'Quote', 'Booked', 'In Progress', 'Completed', 'Invoiced'];
  const currentIndex = statusFlow.indexOf(job.status);

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs>
          <MuiLink component={RouterLink} to="/jobs" underline="hover">Jobs</MuiLink>
          <Typography color="text.primary">Job #{job.id}</Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info Column */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h5" gutterBottom>{job.service}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Created {formatDate(job.createdAt)}
                </Typography>
              </Box>
              <Chip
                label={job.status}
                size="medium"
                color={
                  job.status === 'Completed' || job.status === 'Invoiced' ? 'success' :
                  job.status === 'In Progress' ? 'primary' : 'default'
                }
                sx={{ fontWeight: 600, fontSize: 14 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Quick Actions */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              {job.status !== 'Completed' && job.status !== 'Invoiced' && (
                <Button variant="contained" startIcon={<CompleteIcon />} onClick={() => handleStatusChange('Completed')}>
                  Mark Complete
                </Button>
              )}
              {job.status === 'Completed' && !job.Invoice && (
                <Button variant="outlined" startIcon={<MoneyIcon />} onClick={() => navigate(`/invoices/new?job=${job.id}`)}>
                  Create Invoice
                </Button>
              )}
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/jobs/${jobId}/edit`)}>
                Edit
              </Button>
            </Box>

      {/* Job Timeline */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Job Timeline</Typography>
        <Box sx={{ position: 'relative', pl: 2, borderLeft: 2, borderColor: 'divider' }}>
          {statusFlow.map((status, idx) => {
            const isCompleted = idx <= currentIndex;
            return (
              <Box key={status} sx={{ position: 'relative', mb: 3, '&:last-child': { mb: 0 } }}>
                <Avatar
                  sx={{
                    position: 'absolute',
                    left: -44,
                    width: 28,
                    height: 28,
                    fontSize: 14,
                    bgcolor: isCompleted ? 'success.main' : 'grey.300'
                  }}
                >
                  {idx + 1}
                </Avatar>
                <Typography variant="body2" color={isCompleted ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: isCompleted ? 600 : 400 }}>
                  {status}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

            {/* Job notes */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              {job.notes ? (
                <Typography paragraph>{job.notes}</Typography>
              ) : (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>No notes added.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar Column */}
        <Grid item xs={12} md={4}>
          {/* Customer & Staff */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Customer</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 40, height: 40 }}>{job.Customer?.name?.charAt(0)}</Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>{job.Customer?.name || 'N/A'}</Typography>
                <Typography variant="caption" color="text.secondary">{job.Customer?.email}</Typography>
              </Box>
            </Box>
            {job.Customer?.phone && (
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PhoneIcon fontSize="small" /> {job.Customer.phone}
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Assigned Staff</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'secondary.main' }}>
                {job.Staff?.name?.charAt(0) || '?'}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>{job.Staff?.name || 'Unassigned'}</Typography>
                <Typography variant="caption" color="text.secondary">{job.Staff?.email || ''}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Job Details */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Details</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                <Typography variant="body2">{formatDate(job.scheduledAt)}</Typography>
              </Box>
              {job.Invoice && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Invoice</Typography>
                  <Typography variant="body2">#{job.Invoice.id} - ${job.Invoice.total.toFixed(2)} ({job.Invoice.status})</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}