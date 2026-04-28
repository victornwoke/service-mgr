# Instructions for Service Manager Frontend (React)

## Project Overview

- This is a React SPA for managing service business operations (dashboard, customers, jobs, staff, invoices, authentication).
- Main entry: `src/App.jsx` (routing, layout, authentication state).
- Pages: `src/pages/` (Dashboard, Customers, Jobs, Staff, Invoices, Login).
- API abstraction: `src/api.js` (axios instance with JWT auth header from localStorage).

## Key Architectural Patterns

- **Routing:** Uses `react-router-dom` for navigation. All main pages are protected by a `PrivateRoute` that checks for a JWT token.
- **Authentication:**
  - Login via `/api/auth/login` (see `Login.jsx`).
  - JWT token is stored in `localStorage` and injected into all API requests via axios interceptor (`api.js`).
  - `App.jsx` manages `user` and `token` state, and persists token to localStorage.
- **API Calls:**
  - Use the `api` instance from `api.js` for all authenticated requests (e.g., `api.get('/customers')`).
  - Do not use raw `axios` for authenticated endpoints—use the shared `api` instance.
- **State Management:**
  - Local component state via React hooks (`useState`, `useEffect`).
  - No Redux or global state library.
- **UI:**
  - Tailwind CSS utility classes for layout and styling.
  - Simple alert and loading patterns (see `Dashboard.jsx`, `Customers.jsx`).

## Developer Workflows

- **Adding a Page:**
  1. Create a new component in `src/pages/`.
  2. Add a route in `App.jsx` inside the `<Routes>` block.
  3. Add a sidebar link if needed.
- **API Integration:**
  - Add new endpoints to `api.js` if custom configuration is needed.
  - Use `api.[get|post|put|delete]` in page components.
- **Authentication:**
  - Use `setToken` and `setUser` from `App.jsx`/`Login.jsx` to update auth state.
  - To log out, call the `logout` function in `App.jsx` (clears token and user).

## Conventions & Patterns

- **Error Handling:**
  - Show errors in a visible alert (see `Customers.jsx`, `Dashboard.jsx`).
- **Loading State:**
  - Use a `loading` boolean and show a spinner or message.
- **Forms:**
  - Controlled components for all forms (see `Customers.jsx`).
- **Component Export:**
  - All page components use `export default function ...`.

## Integration Points

- **Backend:**
  - All API calls are relative to `/api` (see `api.js`).
  - Assumes a backend that supports JWT auth and REST endpoints for customers, jobs, staff, invoices, dashboard, and auth.

## Examples

- Fetching customers: `api.get('/customers')` in `Customers.jsx`.
- Logging in: `axios.post('/api/auth/login', { email, password })` in `Login.jsx`.
- Protecting routes: `<PrivateRoute token={token}><Dashboard /></PrivateRoute>` in `App.jsx`.

---

**Update this file if you add new pages, change authentication, or modify API integration patterns.**
