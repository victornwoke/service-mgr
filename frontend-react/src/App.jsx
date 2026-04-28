import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CustomerForm from './pages/CustomerForm';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import JobForm from './pages/JobForm';
import Staff from './pages/Staff';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Schedule from './pages/Schedule';
import Register from './pages/Register';

function PrivateRoute() {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/new" element={<CustomerForm />} />
            <Route path="/customers/:customerId/edit" element={<CustomerForm />} />
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/new" element={<JobForm />} />
            <Route path="/jobs/:jobId/edit" element={<JobForm />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}