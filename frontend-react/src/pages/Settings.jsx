import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import api from '../api';

function TabPanel({ children, value, index }) {
  return value === index && <Box sx={{ py: 3 }}>{children}</Box>;
}

export default function Settings() {
  const [tab, setTab] = useState(0);
  const [business, setBusiness] = useState({ name: '', address: '', phone: '', email: '', timezone: 'UTC' });
  const [workingHours, setWorkingHours] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleBusinessChange = (field) => (e) => {
    setBusiness({ ...business, [field]: e.target.value });
  };

  const handleSaveBusiness = async () => {
    setLoading(true);
    try {
      // TODO: Implement backend endpoint for business settings
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate
      setSnackbar({ open: true, message: 'Business settings saved', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (day, field) => (e) => {
    setWorkingHours({
      ...workingHours,
      [day]: { ...(workingHours[day] || {}), [field]: e.target.value }
    });
  };

  const handleSaveHours = async () => {
    setLoading(true);
    try {
      // TODO: Persist to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      setSnackbar({ open: true, message: 'Working hours saved', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Business" />
          <Tab label="Working Hours" />
          <Tab label="Services" />
          <Tab label="Security" />
        </Tabs>

        {/* Business Settings */}
        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>Business Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Business Name"
                fullWidth
                value={business.name}
                onChange={handleBusinessChange('name')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={business.email}
                onChange={handleBusinessChange('email')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone"
                fullWidth
                value={business.phone}
                onChange={handleBusinessChange('phone')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={business.address}
                onChange={handleBusinessChange('address')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Timezone"
                select
                fullWidth
                value={business.timezone}
                onChange={handleBusinessChange('timezone')}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveBusiness} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save Business'}
            </Button>
          </Box>
        </TabPanel>

        {/* Working Hours */}
        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>Working Hours</Typography>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <Box key={day} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Typography sx={{ width: 100 }}>{day}</Typography>
              <TextField
                label="Start"
                type="time"
                size="small"
                value={workingHours[day]?.start || '09:00'}
                onChange={handleHoursChange(day, 'start')}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <TextField
                label="End"
                type="time"
                size="small"
                value={workingHours[day]?.end || '17:00'}
                onChange={handleHoursChange(day, 'end')}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 150 }}
              />
              <Button variant="outlined" size="small" sx={{ ml: 'auto' }}>Save</Button>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveHours} disabled={loading}>
            Save All Hours
          </Button>
        </TabPanel>

        {/* Services (placeholder) */}
        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>Service Types</Typography>
          <Alert severity="info">Define the types of services your business offers (e.g., "AC Repair", "Plumbing"). Coming soon!</Alert>
        </TabPanel>

        {/* Security (placeholder) */}
        <TabPanel value={tab} index={3}>
          <Typography variant="h6" gutterBottom>Security</Typography>
          <Alert severity="info">Change password, enable 2FA, manage API keys. Coming soon!</Alert>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}