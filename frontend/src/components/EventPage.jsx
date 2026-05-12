import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { logger } from '../utils/logger';
import './EventPage.css';

export default function EventPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');

    // Ticket counts
    const [ticketCounts, setTicketCounts] = useState({});

    useEffect(() => {
        async function fetchEvent() {
            try {
                const data = await apiFetch(`/api/events/${id}`);
                setEvent(data);

                // Initialize ticket counts
                const initialCounts = {};

                (data.tickets ?? []).forEach(ticket => {
                    initialCounts[ticket.id] = 0;
                });

                setTicketCounts(initialCounts);

            } catch (err) {
                logger.error('Failed to load event details', err);
                setEvent(null);
            } finally {
                setLoading(false);
            }
        }

        fetchEvent();
    }, [id]);

    // Increase ticket count
    function increaseTicket(ticketId) {
        setTicketCounts(prev => ({
            ...prev,
            [ticketId]: prev[ticketId] + 1
        }));
    }

    // Decrease ticket count
    function decreaseTicket(ticketId) {
        setTicketCounts(prev => ({
            ...prev,
            [ticketId]: Math.max(0, prev[ticketId] - 1)
        }));
    }

    // Calculate total price
    const totalPrice = useMemo(() => {
        if (!event) return 0;

        return (event.tickets ?? []).reduce((total, ticket) => {
            return total + (ticket.price * (ticketCounts[ticket.id] || 0));
        }, 0);
    }, [event, ticketCounts]);

    const totalQuantity = useMemo(() => {
        return Object.values(ticketCounts).reduce((a, b) => a + b, 0);
    }, [ticketCounts]);

    async function handleCheckout() {
        if (!user) {
            // Need to be signed in to purchase
            alert("Please sign in or register to purchase tickets.");
            return;
        }

        if (totalQuantity < 1) {
            setCheckoutError('Please select at least 1 ticket.');
            return;
        }

        setCheckoutError('');
        setCheckoutLoading(true);

        try {
            const data = await apiFetch('/api/checkout/create-session', {
                method: 'POST',
                body: JSON.stringify({
                    eventId: event.id,
                    quantity: totalQuantity,
                }),
            });

            // Redirect to Stripe Checkout
            window.location.href = data.sessionUrl;
        } catch (err) {
            setCheckoutError(err.message);
            logger.error('Failed to create checkout session', err);
            setCheckoutLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="single-event-page">
                Loading...
            </div>
        );
    }

    if (!event) {
        return (
            <div className="single-event-page">
                Event not found
            </div>
        );
    }

    return (
        <div className="single-event-page">

            {/* TITLE */}
            <div className="single-event-header">
                <h1 className="single-event-title">
                    {event.title}
                </h1>
            </div>

            {/* MAIN CONTENT */}
            <div className="single-event-content">

                {/* LEFT SIDE */}
                <div className="single-event-left">

                    <div className="single-event-poster">
                        {event.posterUrl ? (
                            <img
                                src={event.posterUrl}
                                alt={event.title}
                            />
                        ) : (
                            <span>CONCERT BANNER</span>
                        )}
                    </div>

                    <div className="single-event-tags">
                        {(event.tags ?? []).map(tag => (
                            <span
                                key={tag.id}
                                className="event-tag"
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="single-event-right">

                    {/* EVENT INFO */}
                    <div className="single-event-info">

                        <div className="event-info-row">
                            <span className="info-label">
                                Date:
                            </span>

                            <span>
                                {new Date(event.date).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div className="event-info-row">
                            <span className="info-label">
                                Location:
                            </span>

                            <span>
                                {event.location}
                            </span>
                        </div>
                    </div>

                    {/* TICKETS */}
                    <div className="ticket-section">

                        <h3>
                            Choose ticket option
                        </h3>

                        {(event.tickets ?? []).map(ticket => (
                            <div
                                key={ticket.id}
                                className="ticket-option"
                            >

                                <div className="ticket-name-price">
                                    <span>
                                        {ticket.type}
                                    </span>

                                    <span>
                                        {ticket.price}€
                                    </span>
                                </div>

                                <div className="ticket-counter">

                                    <button
                                        onClick={() => decreaseTicket(ticket.id)}
                                    >
                                        -
                                    </button>

                                    <span>
                                        {ticketCounts[ticket.id] || 0}
                                    </span>

                                    <button
                                        onClick={() => increaseTicket(ticket.id)}
                                    >
                                        +
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>

                    {/* TOTAL */}
                    <div className="event-total">
                        Total price: <span>{totalPrice.toFixed(2)}€</span>
                    </div>

                    {checkoutError && <div className="checkout-card__error" style={{ color: '#f87171', background: 'rgba(220,60,60,0.1)', padding: '0.6rem 1rem', borderRadius: '0.65rem', border: '1px solid rgba(220,60,60,0.25)', marginBottom: '1rem', fontSize: '0.88rem' }}>{checkoutError}</div>}

                    {/* BUTTON */}
                    <button 
                        className={`checkout-button ${!user ? 'checkout-button--auth' : ''}`}
                        onClick={handleCheckout}
                        disabled={checkoutLoading || totalQuantity < 1}
                        style={{ position: 'relative' }}
                    >
                        {checkoutLoading ? 'Processing...' : !user ? 'Sign In required' : 'Proceed To Checkout'}
                    </button>

                </div>
            </div>

            {/* DESCRIPTION */}
            <details className="event-description-dropdown">

                <summary>
                    EVENT DESCRIPTION
                </summary>

                <div className="event-description-content">
                    {event.description}
                </div>

            </details>

        </div>
    );
}