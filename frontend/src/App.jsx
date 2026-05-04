import { useState, useEffect } from 'react'
import EventPage from './components/EventPage';

function App() {
  // const eventId = "00000000-0000-0000-0000-000000000000";
  const eventId = "98886874-f180-4948-af89-ea624fd5515f";

  return (
    <div>
      <EventPage eventId={eventId} />
    </div>
  );
}

export default App
