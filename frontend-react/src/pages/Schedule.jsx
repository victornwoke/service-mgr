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
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
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
    <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Schedule Overview
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<TodayIcon />}
              onClick={goToToday}
              sx={{ mr: 2 }}
            >
              Today
            </Button>

            {/* Month Navigation */}
            <Tooltip title="Previous Month">
              <IconButton onClick={goToPrevMonth} size="large">
                <NavigateBeforeIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="h6" sx={{ px: 3, fontWeight: 500 }}>
              {weekStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Typography>

            <Tooltip title="Next Month">
              <IconButton onClick={goToNextMonth} size="large">
                <NavigateNextIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

            {/* Week Navigation */}
            <Tooltip title="Previous Week">
              <IconButton onClick={goToPrevWeek} color="primary" size="large">
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="body1" sx={{ px: 2, minWidth: 120, textAlign: 'center' }}>
              Week {Math.ceil((weekStart.getDate() - weekStart.getDay() + 1) / 7)}
            </Typography>

            <Tooltip title="Next Week">
              <IconButton onClick={goToNextWeek} color="primary" size="large">
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ bgcolor: 'grey.50' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon color="action" />
                <Typography variant="subtitle2">Filters:</Typography>
              </Box>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Staff Member</InputLabel>
                <Select
                  value={filters.staffId}
                  label="Staff Member"
                  onChange={e => setFilters({...filters, staffId: e.target.value})}
                >
                  <MenuItem value="">All Staff</MenuItem>
                  {/* Staff options would be populated from API */}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Job Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Job Status"
                  onChange={e => setFilters({...filters, status: e.target.value})}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Pending">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      Pending
                    </Box>
                  </MenuItem>
                  <MenuItem value="Booked">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                      Booked
                    </Box>
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      In Progress
                    </Box>
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                      Completed
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          {/* Week Days Header */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {getWeekDays().map(day => {
              const isToday = new Date().toDateString() === day.toDateString();
              const isSelectedWeek = weekStart.toDateString() === day.toDateString();
              const dayJobs = getJobsForDay(day);

              return (
                <Grid item xs={12} sm={6} md={4} lg={2} key={day.toISOString()}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelectedWeek ? 2 : 1,
                      borderColor: isSelectedWeek ? 'primary.main' : 'divider',
                      bgcolor: isToday ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => setWeekStart(new Date(day))}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color={isToday ? 'primary.contrastText' : 'text.primary'}
                      >
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Typography>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color={isToday ? 'primary.contrastText' : 'text.primary'}
                      >
                        {day.getDate()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={isToday ? 'primary.contrastText' : 'text.secondary'}
                      >
                        {day.toLocaleDateString('en-US', { month: 'short' })}
                      </Typography>
                      {isToday && (
                        <Chip
                          label="Today"
                          size="small"
                          sx={{
                            mt: 1,
                            bgcolor: 'primary.contrastText',
                            color: 'primary.main',
                            fontWeight: 600
                          }}
                        />
                      )}
                      {dayJobs.length > 0 && (
                        <Badge
                          badgeContent={dayJobs.length}
                          color="secondary"
                          sx={{ mt: 1, '& .MuiBadge-badge': { fontSize: 12, height: 20, minWidth: 20 } }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Schedule Grid */}
          <Grid container spacing={3}>
            {getWeekDays().map(day => {
              const dayJobs = getJobsForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <Grid item xs={12} sm={6} md={4} lg={2} key={day.toISOString()}>
                  <Card
                    sx={{
                      minHeight: 500,
                      bgcolor: isToday ? 'primary.50' : 'background.paper',
                      border: isToday ? 1 : 0,
                      borderColor: 'primary.main'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: isToday ? 'primary.main' : 'text.primary',
                          borderBottom: 1,
                          borderColor: 'divider',
                          pb: 1
                        }}
                      >
                        {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        {isToday && ' (Today)'}
                      </Typography>

                      {dayJobs.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            No jobs scheduled
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayJobs.map(job => (
                            <Card
                              key={job.id}
                              sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderLeft: 4,
                                borderColor: job.status === 'Completed' ? 'success.main' :
                                           job.status === 'In Progress' ? 'primary.main' :
                                           job.status === 'Booked' ? 'info.main' : 'warning.main',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: 3,
                                  bgcolor: 'action.hover'
                                }
                              }}
                              onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                                    {job.service}
                                  </Typography>
                                  <Chip
                                    label={job.status}
                                    size="small"
                                    sx={{
                                      fontSize: 10,
                                      height: 20,
                                      bgcolor: job.status === 'Completed' ? 'success.main' :
                                             job.status === 'In Progress' ? 'primary.main' :
                                             job.status === 'Booked' ? 'info.main' : 'warning.main',
                                      color: 'white'
                                    }}
                                  />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(job.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption">
                                    {job.Staff?.name || 'Unassigned'}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                                    {job.Customer?.name || 'Unknown Customer'}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Container>
  );
}