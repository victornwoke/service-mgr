import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Divider,
  Snackbar
} from '@mui/material';
import { ArrowBack as BackIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount) || 0);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '-';

  const handleStatusToggle = async (invoice) => {
    const newStatus = invoice.status === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.patch(`/invoices/${invoice.id}`, { status: newStatus });
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: newStatus } : inv));
      // Show quick feedback (snackbar later)
    } catch (err) {
      alert('Failed to update invoice status');
    }
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component="button" onClick={() => navigate('/dashboard')} underline="hover">Home</MuiLink>
        <Typography color="text.primary">Invoices</Typography>
      </Breadcrumbs>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 3
      }}>
        <Typography variant="h4">Invoice Management</Typography>
        <Button
          variant="contained"
          startIcon={<ReceiptIcon />}
          onClick={() => navigate('/invoices/new')}
          fullWidth={{ xs: true, sm: false }}
        >
          Create Invoice
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Issued</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No invoices found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                   invoices.map(inv => (
                     <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                       <TableCell>#{inv.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2">Job #{inv.Job?.id || inv.jobId}</Typography>
                        <Typography variant="caption" color="text.secondary">{inv.Job?.service || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>{inv.Job?.Customer?.name || 'N/A'}</TableCell>
                      <TableCell align="right" fontWeight={500}>{formatCurrency(inv.total)}</TableCell>
                      <TableCell>
                        <Chip
                          label={inv.status}
                          size="small"
                          color={inv.status === 'Paid' ? 'success' : 'error'}
                          clickable
                          onClick={(e) => { e.stopPropagation(); handleStatusToggle(inv); }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(inv.issuedAt)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => alert('Invoice details view coming soon')}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}