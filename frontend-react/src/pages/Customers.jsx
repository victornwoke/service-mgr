import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setSnackbar({ open: true, message: 'Customer deleted', severity: 'success' });
      fetchCustomers();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}>
          New Customer
        </Button>
      </Box>

      <TextField
        placeholder="Search customers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          )
        }}
      />

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={2}>
          {(customers || []).filter(c => 
            search === '' || 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
          ).map(customer => (
            <Grid item xs={12} sm={6} md={4} key={customer.id}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{customer.name.charAt(0)}</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={500}>{customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{customer.email}</Typography>
                  </Box>
                </Box>
                {customer.phone && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
                    {customer.phone}
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/customers/${customer.id}/edit`)}>Edit</Button>
                  <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => handleDelete(customer.id)}>Delete</Button>
                  <Button size="small" onClick={() => navigate(`/customers/${customer.id}`)}>View</Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}