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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../api';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'Staff', password: '' });
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (member = null) => {
    if (member) {
      setEditing(member);
      setForm({ name: member.name, email: member.email, role: member.role, password: '' });
    } else {
      setEditing(null);
      setForm({ name: '', email: '', role: 'Staff', password: '' });
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/staff/${editing.id}`, payload);
        setSnackbar({ open: true, message: 'Staff updated', severity: 'success' });
      } else {
        if (!form.password) {
          setError('Password is required');
          setLoading(false);
          return;
        }
        await api.post('/staff', form);
        setSnackbar({ open: true, message: 'Staff created', severity: 'success' });
      }
      handleClose();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      setSnackbar({ open: true, message: 'Staff deleted', severity: 'success' });
      fetchStaff();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3
      }}>
        <Typography variant="h4">Staff Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          fullWidth={{ xs: true, sm: false }}
        >
          Add Staff Member
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <Grid container spacing={3}>
          {staff.map(member => (
            <Grid item xs={12} sm={6} md={4} key={member.id}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: member.role === 'Admin' ? 'secondary.main' : 'primary.main' }}>
                  {member.name.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">{member.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{member.email}</Typography>
                  <Chip label={member.role} size="small" color={member.role === 'Admin' ? 'secondary' : 'default'} sx={{ mt: 1 }} />
                </Box>
                <Box>
                  <IconButton size="small" onClick={() => handleOpen(member)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(member.id)}><DeleteIcon /></IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={form.role} label="Role" onChange={handleChange}>
                <MenuItem value="Staff">Staff</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!editing}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <><SaveIcon /> Save</>}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}