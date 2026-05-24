import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import EventListPage from './EventListPage';
import MyEventsList from './MyEventsList';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import EventDetails from './EventDetails';
import EventStatistics from './EventStatistics';
import EventDashboard from './EventDashboard';
import CheckoutSuccess from './components/CheckoutSuccess';
import CheckoutCancel from './components/CheckoutCancel';
import EventPage from './components/EventPage';
import EventOrders from './EventOrders';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const MANAGER_ROLES = ['Manager', 'SuperAdmin'];

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<EventListPage />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel"  element={<CheckoutCancel />} />

          {/* Manager / SuperAdmin routes */}
          <Route path="/my-events" element={
            <ProtectedRoute roles={MANAGER_ROLES}><MyEventsList /></ProtectedRoute>
          } />
          <Route path="/create-event" element={
            <ProtectedRoute roles={MANAGER_ROLES}><CreateEvent /></ProtectedRoute>
          } />
          <Route path="/edit-event/:id" element={
            <ProtectedRoute roles={MANAGER_ROLES}><EditEvent /></ProtectedRoute>
          } />
          <Route path="/event-details/:id" element={
            <ProtectedRoute roles={MANAGER_ROLES}><EventDetails /></ProtectedRoute>
          } />
          <Route path="/event-orders/:id" element={
            <ProtectedRoute roles={MANAGER_ROLES}><EventOrders /></ProtectedRoute>
          } />
          <Route path="/event-statistics/:id" element={
            <ProtectedRoute roles={MANAGER_ROLES}><EventStatistics /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={MANAGER_ROLES}><EventDashboard /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
