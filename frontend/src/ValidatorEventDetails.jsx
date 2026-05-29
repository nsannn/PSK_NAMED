import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function ValidatorEventDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'Validator') {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [eventData, assignedEvents] = await Promise.all([
          apiFetch(`/api/events/${id}`),
          apiFetch('/api/events/validator-assigned')
        ]);

        const isAssigned = assignedEvents.some(ev => ev.id === eventData.id);
        setAllowed(isAssigned);
        setEvent(isAssigned ? eventData : null);
      } catch (err) {
        logger.error('Failed to load validator event details', err);
        setEvent(null);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, id, user]);

  if (authLoading || loading) {
    return <div className="page-loading">Loading event details...</div>;
  }

  if (user?.role !== 'Validator') {
    return <div className="page-loading">You do not have permission to view this page.</div>;
  }

  if (!allowed || !event) {
    return <div className="page-loading">This event is not assigned to you.</div>;
  }

  const formattedDate = formatEventDate(event.date);
  const tagCount = (event.tags ?? []).length;

  return (
    <div className="validator-shell align_column" style={{ gap: '1.25rem' }}>
      <div className="validator-hero">
        <div className="validator-hero__title">
          <span className="validator-hero__eyebrow">Validator workspace</span>
          <span className="validator-hero__headline">Event Overview</span>
          <span className="validator-hero__subtle">A production-focused event summary for validators. Confirm the details, then jump to scanning without leaving the workflow.</span>
        </div>
        <div className="validator-hero__meta">
          <span className="validator-chip">Assigned to you</span>
          <span className="validator-chip">{tagCount} tag{tagCount === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="validator-detail-grid">
        <section className="validator-detail-main">
          <div className="validator-detail-card">
            <div className="validator-detail-card__header">
              <div className="validator-detail-card__title">
                <span className="validator-chip validator-chip--compact">Assigned Event</span>
                <h1>{event.title}</h1>
                <p>{event.description}</p>
              </div>
              <div className="validator-detail-card__actions">
                <button className="btn btn--accent btn--full" onClick={() => navigate(`/validate-ticket?eventId=${event.id}`)}>
                  Scan Tickets
                </button>
                <button className="btn btn--outline btn--full" onClick={() => navigate('/validator-dashboard')}>
                  Back to Dashboard
                </button>
              </div>
            </div>

            <div className="validator-detail-card__facts">
              <article className="validator-detail-fact">
                <span>Date</span>
                <strong>{formattedDate}</strong>
              </article>
              <article className="validator-detail-fact">
                <span>Location</span>
                <strong>{event.location}</strong>
              </article>
              <article className="validator-detail-fact">
                <span>Validation mode</span>
                <strong>This event only</strong>
              </article>
            </div>
          </div>

          <div className="validator-detail-card">
            <div className="validator-detail-section-head">
              <strong>Event notes</strong>
            </div>
            <div className="validator-detail-notes">
              <p>{event.description}</p>
            </div>
          </div>
        </section>

        <aside className="validator-detail-side">
          <section className="validator-detail-card validator-detail-card--poster">
            <div className="validator-detail-section-head">
              <strong>Poster</strong>
              <span>{event.hasPoster ? 'Available' : 'Not uploaded'}</span>
            </div>
            <div className="validator-detail-poster">
              {event.hasPoster ? (
                <img
                  src={`/api/events/${event.id}/poster`}
                  alt={event.title}
                />
              ) : (
                <span>No poster available</span>
              )}
            </div>
          </section>

          <section className="validator-detail-card">
            <div className="validator-detail-section-head">
              <strong>Tags</strong>
              <span>Classification</span>
            </div>
            <div className="validator-detail-tags">
              {(event.tags ?? []).length === 0 ? (
                <span className="validator-empty">No tags assigned.</span>
              ) : (
                (event.tags ?? []).map(tag => (
                  <span key={tag.id} className="validator-chip validator-chip--compact">{tag.name}</span>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
