import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Divider,
  Tooltip,
  IconButton,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon,
  CheckCircle as CompleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ dailyJobs: 0, monthlyRevenue: 0, unpaidInvoices: 0, totalJobs: 0, completedJobs: 0 });
  const [todayJobs, setTodayJobs] = useState([]);
  const [overdueJobs, setOverdueJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/dashboard/today'),
      api.get('/dashboard/overdue')
    ]).then(([statsRes, todayRes, overdueRes]) => {
      setStats(statsRes.data);
      setTodayJobs(todayRes.data.jobs || []);
      setOverdueJobs(overdueRes.data.jobs || []);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await api.patch(`/jobs/${jobId}`, { status: newStatus });
      setTodayJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
      setStats(prev => ({ ...prev, dailyJobs: prev.dailyJobs - 1, completedJobs: prev.completedJobs + 1 }));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const formatDate = (dateStr) => new Date(dateStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  return (
    <Box>
      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}>New Customer</Button>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/jobs/new')}>New Job</Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card><CardContent><Typography color="textSecondary" gutterBottom>Today's Jobs</Typography><Typography variant="h4">{stats.dailyJobs}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card><CardContent><Typography color="textSecondary" gutterBottom>Monthly Revenue</Typography><Typography variant="h4">${stats.monthlyRevenue.toFixed(2)}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card><CardContent><Typography color="textSecondary" gutterBottom>Unpaid Invoices</Typography><Typography variant="h4" color="error">{stats.unpaidInvoices}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Jobs</Typography><Typography variant="h4">{stats.totalJobs}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card><CardContent><Typography color="textSecondary" gutterBottom>Completed</Typography><Typography variant="h4" color="success.main">{stats.completedJobs}</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Jobs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Today's Jobs</Typography>
              <Chip label={todayJobs.length} size="small" />
            </Box>
            {todayJobs.length === 0 ? (
              <Alert severity="info">No jobs scheduled for today.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Staff</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayJobs.map(job => (
                      <TableRow key={job.id} hover>
                        <TableCell>{formatDate(job.scheduledAt)}</TableCell>
                        <TableCell>{job.Customer?.name || 'N/A'}</TableCell>
                        <TableCell>{job.service}</TableCell>
                        <TableCell>{job.Staff?.name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={job.status} 
                            size="small"
                            color={
                              job.status === 'Completed' ? 'success' :
                              job.status === 'In Progress' ? 'primary' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigate(`/jobs/${job.id}`)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {job.status !== 'Completed' && job.status !== 'Invoiced' && (
                            <Tooltip title="Mark Complete">
                              <IconButton size="small" color="success" onClick={() => handleStatusChange(job.id, 'Completed')}>
                                <CompleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Overdue Jobs */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="error" />
              <Typography variant="h6">Overdue</Typography>
              <Chip label={overdueJobs.length} size="small" color={overdueJobs.length > 0 ? 'error' : 'default'} />
            </Box>
            {overdueJobs.length === 0 ? (
              <Alert severity="success">All jobs on schedule!</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {overdueJobs.map(job => (
                  <Paper key={job.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" noWrap>{job.service}</Typography>
                    <Typography variant="body2" color="text.secondary">{job.Customer?.name}</Typography>
                    <Typography variant="caption" color="error">
                      Due: {new Date(job.scheduledAt).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={job.status} size="small" variant="outined" />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}