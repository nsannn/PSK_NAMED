import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyEventsList from './MyEventsList';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import EventDetails from './EventDetails';
import EventStatistics from './EventStatistics';
import EventDashboard from './EventDashboard';
import TicketValidation from "./TicketValidation";
import CheckoutSuccess from './components/CheckoutSuccess';
import CheckoutCancel from './components/CheckoutCancel';
import EventPage from './components/EventPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<MyEventsList />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/edit-event/:id" element={<EditEvent />} />
          <Route path="/event-details/:id" element={<EventDetails />} />
          <Route path="/event-statistics/:id" element={<EventStatistics />} />
          <Route path="/dashboard" element={<EventDashboard />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/ticket-validation" element={<TicketValidation />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
