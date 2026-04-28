import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Initial admin setup
          </Typography>
        </Box>

        {success ? (
          <Alert severity="success">
            Admin account created! You can now&nbsp;
            <MuiLink component="button" onClick={() => window.location.href = '/login'} underline="hover">log in</MuiLink>.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Admin'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <MuiLink href="/login" underline="hover">
                Already have an account? Sign in
              </MuiLink>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}