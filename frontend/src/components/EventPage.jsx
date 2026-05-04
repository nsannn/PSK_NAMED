import { useEffect, useState } from 'react';
import './EventPage.css';

export default function EventPage({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        
        if (!res.ok) {
          setEvent(null);
          return;
        }

        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  if (loading) return <div className="event-page">Loading...</div>;
  if (!event) return <div className="event-page">Event not found</div>;

  return (
    <div className="event-page">
      <div className="event-card">
        <h1 className="event-title">{event.title}</h1>

        <div className="event-divider" />

        <p className="event-description">{event.description}</p>

        <div className="event-meta">
          <p><strong>Date:</strong> {new Date(event.date).toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p><strong>Location:</strong> {event.location}</p>
        </div>

        <div className="event-tickets">
          {(event.tickets ?? []).map(ticket => (
            <div key={ticket.id} className="event-ticket">
              <span>{ticket.type}</span>
              <span>{ticket.price} €</span>
            </div>
          ))}
        </div>

        <div className="event-tags">
          {(event.tags ?? []).map(tag => (
            <span key={tag.id} className="event-tag">{tag.name}</span>
          ))}
        </div>

        <button className="btn btn--accent">
          Register for Event
        </button>
      </div>
    </div>
  );
}