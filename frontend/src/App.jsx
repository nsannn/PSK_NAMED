import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyEventsList from './MyEventsList';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import EventDetails from './EventDetails';
import EventStatistics from './EventStatistics';
import EventDashboard from './EventDashboard';
import EventPage from './components/EventPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<MyEventsList />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/edit-event/:id" element={<EditEvent />} />
          <Route path="/event-details/:id" element={<EventDetails />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="/event-statistics/:id" element={<EventStatistics />} />
          <Route path="/dashboard" element={<EventDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
