import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Container,
  Breadcrumbs,
  Link,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';

const drawerWidth = 260;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />},
  { path: '/schedule', label: 'Schedule', icon: <CalendarIcon />},
  { path: '/customers', label: 'Customers', icon: <PeopleIcon />},
  { path: '/jobs', label: 'Jobs', icon: <WorkIcon />},
  { path: '/staff', label: 'Staff', icon: <PersonIcon />},
  { path: '/invoices', label: 'Invoices', icon: <ReceiptIcon />},
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeUI = useTheme();
  const isMobile = useMediaQuery(themeUI.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId, jobId } = useParams();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2}}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ServiceManager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': { backgroundColor: 'primary.light', color: 'primary.contrastText' },
                '&.Mui-selected:hover': { backgroundColor: 'primary.main' }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{my: 1}} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/settings')}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard" style={{cursor: 'pointer'}}>
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = '/' + pathnames.slice(0, index + 1).join('/');
          const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
          return index === pathnames.length - 1 ? (
            <Typography key={to} color="text.primary">{label}</Typography>
          ) : (
            <Link key={to} underline="hover" color="inherit" href={to} style={{cursor: 'pointer'}}>
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {(() => {
              const path = location.pathname;
              if (path.startsWith('/customers') && customerId) return 'Customer';
              if (path.startsWith('/jobs') && jobId) return 'Job Detail';
              if (path.startsWith('/settings')) return 'Settings';
              return navItems.find(i => path.startsWith(i.path))?.label || 'Service Manager';
            })()}
          </Typography>
          <IconButton color="inherit" onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50'
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          {getBreadcrumbs()}
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}