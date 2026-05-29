import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './ValidatorExperience.css';
import './main.css';

function formatEventDate(dateValue) {
  return new Date(dateValue).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function ValidatorDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'Validator') {
      setLoading(false);
      return;
    }

    apiFetch('/api/events/validator-assigned')
      .then(data => setEvents(data))
      .catch(err => {
        logger.error('Failed to load validator events', err);
        setLoadError('We could not load your assigned events. Please refresh and try again.');
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <div className="page-loading">Loading assigned events...</div>;
  }

  if (user?.role !== 'Validator') {
    return <div className="page-loading">You do not have permission to view this page.</div>;
  }

  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date(Date.now() - 86400000));
  const tomorrow = startOfDay(new Date(Date.now() + 86400000));

  const grouped = events.reduce((acc, event) => {
    const eventDate = startOfDay(event.date);
    const key =
      eventDate.getTime() === yesterday.getTime() ? 'Yesterday' :
      eventDate.getTime() === today.getTime() ? 'Today' :
      'Tomorrow';
    (acc[key] ||= []).push(event);
    return acc;
  }, {});

  const cards = [
    { label: 'Yesterday', items: grouped.Yesterday || [] },
    { label: 'Today', items: grouped.Today || [] },
    { label: 'Tomorrow', items: grouped.Tomorrow || [] }
  ];

  const todayCount = cards[0].items.length;
  const tomorrowCount = cards[1].items.length;
  const totalCount = events.length;
  const nextEvent = [...events]
    .filter(event => new Date(event.date) >= new Date())
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0];

  if (loadError) {
    return (
      <div className="validator-shell align_column" style={{ gap: '1.25rem' }}>
        <div className="validator-hero">
          <div className="validator-hero__title">
            <span className="validator-hero__eyebrow">Validator workspace</span>
            <span className="validator-hero__headline">Assigned Events</span>
            <span className="validator-hero__subtle">Your dashboard could not be loaded.</span>
          </div>
        </div>
        <div className="validator-empty">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="validator-shell align_column" style={{ gap: '1.25rem' }}>
      <div className="validator-hero">
        <div className="validator-hero__title">
          <span className="validator-hero__eyebrow">Validator workspace</span>
          <span className="validator-hero__headline">Assigned Events</span>
          <span className="validator-hero__subtle">Events from yesterday, today, and tomorrow appear here so late-night check-ins stay available after midnight. Open an event for details or jump straight into scanning.</span>
        </div>
        <div className="validator-hero__meta">
          <span className="validator-chip">Yesterday + Today + Tomorrow</span>
          <span className="validator-chip">{totalCount} assigned</span>
          <span className="validator-chip">{user?.firstName} {user?.lastName}</span>
        </div>
      </div>

      <div className="validator-metrics-grid">
        <article className="validator-metric-card">
          <span className="validator-metric-card__label">Today</span>
          <strong>{todayCount}</strong>
          <span>Scheduled for {today.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
        </article>
        <article className="validator-metric-card">
          <span className="validator-metric-card__label">Tomorrow</span>
          <strong>{tomorrowCount}</strong>
          <span>Assigned for {tomorrow.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
        </article>
        <article className="validator-metric-card">
          <span className="validator-metric-card__label">Next up</span>
          <strong>{nextEvent ? formatEventDate(nextEvent.date) : 'No upcoming event'}</strong>
          <span>{nextEvent ? nextEvent.title : 'You are clear for now.'}</span>
        </article>
      </div>

      <section className="validator-workflow-card">
        <div className="validator-workflow-card__content">
          <span className="validator-hero__eyebrow">Workflow</span>
          <h2>Open an event, confirm the details, then scan tickets at the gate.</h2>
          <p>Use the event detail page when you need context. Go straight to the scanner when the line is moving and you only need validation.</p>
        </div>
      </section>

      <div className="validator-section-list">
        {cards.map(section => (
          <section key={section.label} className="validator-section">
            <div className="validator-section__header">
              <div className="validator-section__title">
                <strong>{section.label}</strong>
                <span>{section.items.length} event{section.items.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            {section.items.length === 0 ? (
              <div className="validator-empty">No assigned events for {section.label.toLowerCase()}.</div>
            ) : (
              <div className="align_column" style={{ gap: '1rem' }}>
                {section.items.map(event => (
                  <article key={event.id} className="validator-event-card">
                    <div className="validator-event-card__poster">
                      {event.hasPoster ? (
                        <img
                          src={`/api/events/${event.id}/poster`}
                          alt={event.title}
                        />
                      ) : (
                        'No Poster'
                      )}
                    </div>

                    <div className="validator-event-card__body">
                      <div className="validator-event-card__name">
                        <strong>{event.title}</strong>
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                      <div className="validator-event-card__meta-row">
                        <span className="validator-chip validator-chip--compact">{section.label}</span>
                        <span className="validator-event-card__meta">{event.location}</span>
                      </div>
                      <span className="validator-event-card__description">{event.description}</span>
                    </div>

                    <div className="validator-event-card__actions">
                      <button className="btn btn--outline btn--full" onClick={() => navigate(`/validator-event/${event.id}`)}>Open Event</button>
                      <button className="btn btn--accent btn--full" onClick={() => navigate(`/validate-ticket?eventId=${event.id}`)}>Scan Tickets</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
