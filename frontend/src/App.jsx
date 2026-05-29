import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyEventsList from './MyEventsList';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import EventDetails from './EventDetails';
import EventStatistics from './EventStatistics';
import EventDashboard from './EventDashboard';
import MyTicketsList from './MyTicketsList';
import TicketValidation from "./TicketValidation";
import ValidatorDashboard from './ValidatorDashboard';
import ValidatorEventDetails from './ValidatorEventDetails';
import CheckoutSuccess from './components/CheckoutSuccess';
import CheckoutCancel from './components/CheckoutCancel';
import EventPage from './components/EventPage';
import EventOrders from './EventOrders';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function HomeRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (user?.role === 'Validator' && location.pathname === '/') {
    return <Navigate to="/validator-dashboard" replace />;
  }

  return <MyEventsList />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/validator-dashboard" element={<ValidatorDashboard />} />
          <Route path="/validator-event/:id" element={<ValidatorEventDetails />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/edit-event/:id" element={<EditEvent />} />
          <Route path="/event-details/:id" element={<EventDetails />} />
          <Route path="/event-orders/:id" element={<EventOrders />} />
          <Route path="/event-statistics/:id" element={<EventStatistics />} />
          <Route path="/dashboard" element={<EventDashboard />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/my-tickets" element={<MyTicketsList />} />
          <Route path="/validate-ticket" element={<TicketValidation />} />
          <Route path="/ticket-validation" element={<TicketValidation />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
