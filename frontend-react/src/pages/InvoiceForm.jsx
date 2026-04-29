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
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import api from '../api';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('job') || '';

  const [form, setForm] = useState({
    jobId: initialJobId || '',
    total: '',
    status: 'Unpaid',
    issuedAt: new Date().toISOString().slice(0, 16), // Current date/time
    pdfUrl: ''
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch jobs that can be invoiced (Completed status)
        const jobsRes = await api.get('/jobs');
        const allJobs = jobsRes.data.jobs || jobsRes.data || [];
        const invoiceableJobs = allJobs.filter(job => job.status === 'Completed' && !job.Invoice);
        setJobs(invoiceableJobs);

        // If we have an initial jobId, pre-fill the form
        if (initialJobId) {
          const selectedJob = invoiceableJobs.find(job => job.id.toString() === initialJobId);
          if (selectedJob) {
            setForm(prev => ({
              ...prev,
              jobId: initialJobId,
              total: selectedJob.service ? '0.00' : prev.total // You might want to calculate based on service type
            }));
          }
        }
      } catch (err) {
        setError('Failed to load data');
      }
    };

    fetchData();
  }, [initialJobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/invoices', form);
      setSnackbar({ open: true, message: 'Invoice created successfully!', severity: 'success' });
      setTimeout(() => navigate('/invoices'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create invoice';
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const selectedJob = jobs.find(job => job.id.toString() === form.jobId);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component={RouterLink} to="/invoices" underline="hover">Invoices</MuiLink>
            <Typography color="text.primary">New Invoice</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/invoices')}
            variant="outlined"
          >
            Back to Invoices
          </Button>
          <Typography variant="h4" component="h1">
            Create New Invoice
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Job</InputLabel>
                  <Select
                    value={form.jobId}
                    onChange={(e) => handleChange('jobId', e.target.value)}
                    label="Job"
                  >
                    {jobs.map(job => (
                      <MenuItem key={job.id} value={job.id}>
                        #{job.id} - {job.service} ({job.Customer?.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedJob && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Job Details</Typography>
                    <Typography variant="body2">
                      <strong>Service:</strong> {selectedJob.service}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Customer:</strong> {selectedJob.Customer?.name} ({selectedJob.Customer?.email})
                    </Typography>
                    <Typography variant="body2">
                      <strong>Scheduled:</strong> {new Date(selectedJob.scheduledAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  type="number"
                  step="0.01"
                  required
                  value={form.total}
                  onChange={(e) => handleChange('total', e.target.value)}
                  InputProps={{
                    startAdornment: '$'
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="Unpaid">Unpaid</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Issue Date & Time"
                  type="datetime-local"
                  required
                  value={form.issuedAt}
                  onChange={(e) => handleChange('issuedAt', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="PDF URL (Optional)"
                  value={form.pdfUrl}
                  onChange={(e) => handleChange('pdfUrl', e.target.value)}
                  placeholder="https://example.com/invoice.pdf"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/invoices')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <ReceiptIcon />}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </Box>
          </form>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}