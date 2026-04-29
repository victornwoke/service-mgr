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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Alert,
  AlertTitle,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', staffId: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.staffId) params.append('staffId', filters.staffId);
      
      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await api.patch(`/jobs/${jobId}`, { status: newStatus });
      setSnackbar({ open: true, message: 'Job status updated', severity: 'success' });
      fetchJobs();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', staffId: '' });
    fetchJobs();
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3
      }}>
        <Typography variant="h4">Job Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/jobs/new')}
          fullWidth={{ xs: true, sm: false }}
        >
          Create New Job
        </Button>
      </Box>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            onBlur={fetchJobs}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon /></InputAdornment>
              )
            }}
          />
          <Button variant={showFilters ? 'contained' : 'outlined'} startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
          <Button variant="text" startIcon={<ClearIcon />} onClick={clearFilters}>Clear</Button>
        </Box>

        {showFilters && (
          <Fade in={showFilters}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={e => { setFilters({ ...filters, status: e.target.value }); fetchJobs(); }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Quote">Quote</MenuItem>
                  <MenuItem value="Booked">Booked</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Invoiced">Invoiced</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Fade>
        )}
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : jobs.length === 0 ? (
        <Alert severity="info">No jobs found. Create your first job!</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(job.scheduledAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(job.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{job.Customer?.name || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">{job.Customer?.email}</Typography>
                  </TableCell>
                  <TableCell>{job.service}</TableCell>
                  <TableCell>{job.Staff?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      size="small"
                      color={
                        job.status === 'Completed' || job.status === 'Invoiced' ? 'success' :
                        job.status === 'In Progress' ? 'primary' :
                        job.status === 'Quote' ? 'warning' : 'default'
                      }
                      onClick={() => {
                        if (job.status === 'Pending') handleStatusChange(job.id, 'Quote');
                      }}
                      sx={{ cursor: job.status === 'Pending' ? 'pointer' : 'default' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => navigate(`/jobs/${job.id}`)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Snackbar for feedback */}
      {/* We'll use MUI Snackbar later; omitted for brevity */}
    </Box>
  );
}