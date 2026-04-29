import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Schedule() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    // Start from the Monday of the current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday;
  });
  const [filters, setFilters] = useState({ staffId: '', status: '' });

  useEffect(() => {
    fetchJobs();
  }, [weekStart, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const start = new Date(weekStart);
      start.setDate(start.getDate() - start.getDay() + 1); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const params = new URLSearchParams();
      params.append('startDate', start.toISOString().split('T')[0]);
      params.append('endDate', end.toISOString().split('T')[0]);
      if (filters.staffId) params.append('staffId', filters.staffId);
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToToday = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    setWeekStart(monday);
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(weekStart);
    start.setDate(start.getDate() - start.getDay() + 1);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDay = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const goToPrevMonth = () => {
    setWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getJobsForDay = (date) => {
    const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
    return jobs.filter(job => {
      const scheduled = new Date(job.scheduledAt);
      return scheduled >= dayStart && scheduled <= dayEnd;
    }).sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Schedule</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<TodayIcon />} onClick={goToToday}>Today</Button>
          <IconButton onClick={goToPrevMonth} size="small"><NavigateBeforeIcon /></IconButton>
          <Typography variant="button" sx={{ px: 2, py: 1 }}>
            Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Typography>
          <IconButton onClick={goToNextMonth} size="small"><NavigateNextIcon /></IconButton>
          <IconButton onClick={goToPrevWeek} color="primary"><ChevronLeftIcon /></IconButton>
          <IconButton onClick={goToNextWeek} color="primary"><ChevronRightIcon /></IconButton>
        </Box>
      </Box>

      {/* Week header */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {getWeekDays().map(day => {
          const isToday = new Date().toDateString() === day.toDateString();
          const isSelected = weekStart.toDateString() === day.toDateString();
          return (
            <Grid item xs={12} sm={6} md={12} key={day.toISOString()}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'primary.light',
                  color: 'primary.contrastText',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  }
                }}
                onClick={() => setWeekStart(new Date(day))}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {formatDay(day)} {day.toLocaleDateString('en-US', { weekday: 'long' })}
                  {isToday && ' (Today)'}
                  {isSelected && ' ←'}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterIcon color="action" />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Staff</InputLabel>
            <Select value={filters.staffId} label="Staff" onChange={e => setFilters({...filters, staffId: e.target.value})}>
              <MenuItem value="">All</MenuItem>
              {/* staff options would be populated separately */}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filters.status} label="Status" onChange={e => setFilters({...filters, status: e.target.value})}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <Grid container spacing={1}>
          {getWeekDays().map(day => {
            const dayJobs = getJobsForDay(day);
            return (
              <Grid item xs={12} md={4} lg={2} key={day.toISOString()}>
                <Paper sx={{ p: 1, minHeight: 400, bgcolor: 'grey.50' }}>
                  {dayJobs.map(job => (
                    <Paper
                      key={job.id}
                      sx={{
                        p: 1,
                        mb: 1,
                        borderLeft: 4,
                        borderColor: job.status === 'Completed' ? 'success.main' : job.status === 'In Progress' ? 'primary.main' : 'warning.main',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <Typography variant="body2" fontWeight={500} noWrap>{job.service}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(job.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={job.Staff?.name || 'Unassigned'} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                      </Box>
                    </Paper>
                  ))}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}