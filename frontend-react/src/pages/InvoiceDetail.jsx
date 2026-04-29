import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      setInvoice(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = invoice.status === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.patch(`/invoices/${invoice.id}`, { status: newStatus });
      setInvoice(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert('Failed to update invoice status');
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount) || 0);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '-';

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!invoice) return <Typography>Invoice not found</Typography>;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component="button" onClick={() => navigate('/dashboard')} underline="hover">Home</MuiLink>
            <MuiLink component="button" onClick={() => navigate('/invoices')} underline="hover">Invoices</MuiLink>
            <Typography color="text.primary">Invoice #{invoice.id}</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Invoice #{invoice.id}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Print
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download PDF
            </Button>
            <Button variant="outlined" startIcon={<EmailIcon />}>
              Send Email
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Invoice Header */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Invoice Details</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Invoice ID</Typography>
                    <Typography variant="body1">#{invoice.id}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={invoice.status}
                      color={invoice.status === 'Paid' ? 'success' : 'warning'}
                      onClick={handleStatusToggle}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Issued Date</Typography>
                    <Typography variant="body1">{formatDate(invoice.issuedAt)}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{invoice.Job?.Customer?.name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{invoice.Job?.Customer?.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{invoice.Job?.Customer?.phone || 'N/A'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Job Details */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Job Details</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Staff</TableCell>
                      <TableCell>Scheduled Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{invoice.Job?.service || 'N/A'}</TableCell>
                      <TableCell>{invoice.Job?.Staff?.name || 'Unassigned'}</TableCell>
                      <TableCell>{formatDate(invoice.Job?.scheduledAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.Job?.status || 'Unknown'}
                          color={
                            invoice.Job?.status === 'Completed' ? 'success' :
                            invoice.Job?.status === 'In Progress' ? 'info' :
                            invoice.Job?.status === 'Booked' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Invoice Total */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Total Amount</Typography>
                <Typography variant="h4" color="primary">{formatCurrency(invoice.total)}</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Notes */}
          {invoice.Job?.notes && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Job Notes</Typography>
                <Typography variant="body1">{invoice.Job.notes}</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}