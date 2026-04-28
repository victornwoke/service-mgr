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
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api';

export default function CustomerForm() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!customerId);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (customerId && customerId !== 'new') {
      const fetch = async () => {
        try {
          const res = await api.get(`/customers/${customerId}`);
          const data = res.data;
          setForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            notes: data.notes || ''
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setFetchLoading(false);
        }
      };
      fetch();
    }
  }, [customerId]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name required';
    if (!form.email.trim()) return 'Email required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (customerId && customerId !== 'new') {
        await api.put(`/customers/${customerId}`, form);
        setSnackbar({ open: true, message: 'Customer updated', severity: 'success' });
      } else {
        await api.post('/customers', form);
        setSnackbar({ open: true, message: 'Customer created', severity: 'success' });
      }
      setTimeout(() => navigate('/customers'), 1000);
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
        <MuiLink component={MuiLink} underline="hover" onClick={() => navigate('/customers')} style={{cursor:'pointer'}}>Customers</MuiLink>
        <Typography color="text.primary">{customerId === 'new' ? 'New Customer' : 'Edit Customer'}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3, maxWidth: 500, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom align="center">
          {customerId === 'new' ? 'Create Customer' : 'Edit Customer'}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Name"
                fullWidth
                value={form.name}
                onChange={handleChange('name')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={handleChange('email')}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Phone"
                fullWidth
                value={form.phone}
                onChange={handleChange('phone')}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={form.address}
                onChange={handleChange('address')}
                multiline
                rows={2}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                value={form.notes}
                onChange={handleChange('notes')}
                multiline
                rows={3}
                placeholder="Additional details about the customer..."
                size="small"
              />
            </Grid>
            {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/customers')}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save'}
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