import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as BackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function TabPanel({ children, value, index }) {
  return value === index && <Box sx={{ py: 3 }}>{children}</Box>;
}

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/dashboard/customers/${customerId}`);
      setCustomer(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer) return <Alert severity="info">Customer not found</Alert>;

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '-';

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Grid container spacing={3}>
        {/* Left Column: Customer Details */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 24 }}>
                {customer.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{customer.name}</Typography>
                <Typography variant="body2" color="text.secondary">Customer since {formatDate(customer.createdAt)}</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Contact Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmailIcon color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{customer.email}</Typography>
                </Box>
              </Box>
              {customer.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{customer.phone}</Typography>
                  </Box>
                </Box>
              )}
              {customer.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <LocationIcon color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                    <Typography variant="body2">{customer.address}</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tags & Notes Summary */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {customer.Jobs?.some(j => j.status === 'Unpaid') && (
                  <Chip label="Late Payer" size="small" color="error" />
                )}
                {customer.Jobs?.length > 5 && (
                  <Chip label="VIP" size="small" color="secondary" />
                )}
                {customer.Jobs?.length === 0 && (
                  <Chip label="New" size="small" color="default" />
                )}
              </Box>
            </Box>

            {customer.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{customer.notes}</Typography>
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Button fullWidth variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/customers/${customer.id}/edit`)}>
              Edit Customer
            </Button>
          </Paper>
        </Grid>

        {/* Right Column: Tabs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label={`Jobs (${customer.Jobs?.length || 0})`} />
              <Tab label="Notes" />
              <Tab label="Invoices" />
              <Tab label="Files" />
            </Tabs>

            {/* Jobs Tab */}
            <TabPanel value={tab} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Job History</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/jobs/new?customer=${customerId}`)}>
                  New Job
                </Button>
              </Box>
              {customer.Jobs?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Staff</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customer.Jobs.map(job => (
                        <TableRow key={job.id} hover>
                          <TableCell>{formatDate(job.scheduledAt)}</TableCell>
                          <TableCell>{job.service}</TableCell>
                          <TableCell>
                            <Chip
                              label={job.status}
                              size="small"
                              color={
                                job.status === 'Completed' ? 'success' :
                                job.status === 'In Progress' ? 'primary' :
                                job.status === 'Quote' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{job.Staff?.name || 'Unassigned'}</TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => navigate(`/jobs/${job.id}`)}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No jobs yet for this customer.</Alert>
              )}
            </TabPanel>

            {/* Notes Tab */}
            <TabPanel value={tab} index={1}>
              <Typography variant="h6" gutterBottom>Customer Notes</Typography>
              {customer.notes ? (
                <Typography paragraph>{customer.notes}</Typography>
              ) : (
                <Alert severity="info">No notes added.</Alert>
              )}
            </TabPanel>

            {/* Invoices Tab */}
            <TabPanel value={tab} index={2}>
              <Typography variant="h6" gutterBottom>Invoices</Typography>
              {customer.Jobs?.some(j => j.Invoice) ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Job</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Issued</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customer.Jobs.filter(j => j.Invoice).map(job => (
                        <TableRow key={job.Invoice.id}>
                          <TableCell>#{job.Invoice.id}</TableCell>
                          <TableCell>{job.service}</TableCell>
                          <TableCell>${parseFloat(job.Invoice.total).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip label={job.Invoice.status} size="small" color={job.Invoice.status === 'Paid' ? 'success' : 'error'} />
                          </TableCell>
                          <TableCell>{formatDate(job.Invoice.issuedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No invoices yet.</Alert>
              )}
            </TabPanel>

            {/* Files Tab */}
            <TabPanel value={tab} index={3}>
              <Alert severity="info">File attachments coming soon.</Alert>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}