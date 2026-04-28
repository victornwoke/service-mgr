import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Grid,
  Divider,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import api from '../api';

export default function JobForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer') || '';

  const [form, setForm] = useState({
    customerId: initialCustomerId || '',
    staffId: '',
    service: '',
    status: 'Pending',
    scheduledAt: '',
    notes: ''
  });
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!jobId);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, staffRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/staff')
        ]);
        setCustomers(customersRes.data.customers || []);
        setStaff(staffRes.data || []);

        if (jobId && jobId !== 'new') {
          const jobRes = await api.get(`/jobs/${jobId}`);
          const job = jobRes.data;
          setForm({
            customerId: job.customerId || '',
            staffId: job.staffId || '',
            service: job.service || '',
            status: job.status || 'Pending',
            scheduledAt: job.scheduledAt ? job.scheduledAt.slice(0, 16) : '',
            notes: job.notes || ''
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchData();
  }, [jobId]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form };
      if (payload.customerId) payload.customerId = parseInt(payload.customerId, 10);
      if (payload.staffId) payload.staffId = parseInt(payload.staffId, 10);
      // scheduledAt will be passed as ISO string from datetime-local

      if (jobId && jobId !== 'new') {
        await api.patch(`/jobs/${jobId}`, payload);
        setSnackbar({ open: true, message: 'Job updated successfully', severity: 'success' });
        navigate(`/jobs/${jobId}`);
      } else {
        const res = await api.post('/jobs', payload);
        setSnackbar({ open: true, message: 'Job created successfully', severity: 'success' });
        navigate(`/jobs/${res.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <CircularProgress />;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/jobs" underline="hover">Jobs</MuiLink>
        <Typography color="text.primary">{jobId === 'new' ? 'New Job' : 'Edit Job'}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom center>
          {jobId === 'new' ? 'Create New Job' : 'Edit Job'}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="customer-label">Customer *</InputLabel>
                <Select
                  labelId="customer-label"
                  value={form.customerId}
                  label="Customer *"
                  onChange={handleChange('customerId')}
                  required
                  fullWidth
                  MenuProps={{ PaperProps: { style: { maxHeight: 200, minWidth: 160 } } }}
                >
                  {customers.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="staff-label">Staff</InputLabel>
                <Select
                  labelId="staff-label"
                  value={form.staffId}
                  label="Staff"
                  onChange={handleChange('staffId')}
                  fullWidth
                  MenuProps={{ PaperProps: { style: { maxHeight: 200, minWidth: 160 } } }}
                >
                  <MenuItem value="">-- Unassigned --</MenuItem>
                  {staff.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Service Type *"
                value={form.service}
                onChange={handleChange('service')}
                fullWidth
                margin="normal"
                required
                helperText="e.g., 'AC Repair', 'Plumbing Installation'"
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Scheduled Date"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={handleChange('scheduledAt')}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={form.notes}
                onChange={handleChange('notes')}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                placeholder="Job details, special instructions, materials needed..."
                size="small"
              />
            </Grid>
          </Grid>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Job'}
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}