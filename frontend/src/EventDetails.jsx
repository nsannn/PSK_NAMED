import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './EventDetails.css';
import './main.css';

function EventDetails() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        apiFetch('/api/events/' + id)
            .then(data => {
                setEvent(data);
                setLoading(false);
            })
            .catch(err => {
                logger.error('Failed to fetch event details', err);
                setLoading(false);
            });
    }, [id]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await apiFetch('/api/events/' + id, { method: 'DELETE' });
            navigate('/');
        } catch (err) {
            logger.error('Failed to cancel event', err);
            alert('Error cancelling event');
        } finally {
            setIsDeleting(false);
            setShowCancelModal(false);
        }
    };

    if (loading) return <div className="page-loading">Loading event details...</div>;
    if (!event)  return <div className="page-loading">Event not found.</div>;

    const EVENT_TYPES = ['Concert', 'Festival', 'Conference', 'Exhibition', 'Sports'];

    const totalSold = event.tickets.reduce((s, t) => s + t.sold, 0);
    const totalCapacity = event.tickets.reduce((s, t) => s + t.quantity, 0);
    const totalRevenue = event.tickets.reduce((s, t) => s + t.sold * t.price, 0);
    const potentialRevenue = event.tickets.reduce((s, t) => s + t.quantity * t.price, 0);
    const progressPct = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
    const avgPerTicket = totalSold > 0 ? totalRevenue / totalSold : 0;
    const availableTickets = totalCapacity - totalSold;
    const revenueLeft = potentialRevenue - totalRevenue;
    const minPrice = event.tickets.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : 0;

    const formattedDate = new Date(event.date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const eventTypeTags = event.tags.filter(t => EVENT_TYPES.includes(t.name));
    const regularTags = event.tags.filter(t => !EVENT_TYPES.includes(t.name));

    return (
        <>
            {showCancelModal && (
                <>
                    <div
                        id="transparent_panel"
                        style={{ display: 'block', opacity: 0.5, cursor: 'pointer' }}
                        onClick={() => setShowCancelModal(false)}
                    />
                    <div id="delete_confirmation_window" className="align_column" style={{ display: 'flex', opacity: 1 }}>
                        <span id="window_name">Cancel Event?</span>
                        <hr />
                        <span id="window_info">Are you sure you want to cancel {event.title}?</span>
                        <span id="window_small_info">This action cannot be undone.</span>
                        <div id="delete_controls" className="align_row">
                            <button onClick={() => setShowCancelModal(false)}>Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? 'Cancelling...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="align_column">
                <div id="staff_main_row_part">
                    <span id="staff_page_name">Event Details</span>
                </div>

                <div id="staff_main_row_part">
                    {/* Left column — 70% */}
                    <div id="staff_main_column_part" className="align_column details-col-left">

                        {/* Event info card */}
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>{event.title}</span>
                            </div>
                            <hr />
                            <div id="staff_info_card_input_group" className="change_align">
                                <div id="staff_event_card_input" className="align_column">
                                    <label>Date</label>
                                    <span>{formattedDate}</span>
                                </div>
                                <div id="staff_event_card_input" className="align_column">
                                    <label>Location</label>
                                    <span>{event.location}</span>
                                </div>
                            </div>
                            <div id="staff_event_card_input" className="align_column">
                                <label>Description</label>
                                <textarea
                                    id="staff_event_description"
                                    className="details-textarea-readonly"
                                    readOnly
                                    value={event.description}
                                    onChange={() => {}}
                                />
                            </div>
                        </div>

                        {/* Ticket Sales + Revenue */}
                        <div id="staff_main_row_part" className="details-full-row">
                            <div id="staff_main_column_part" className="staff_event_statistics align_column">
                                <div id="staff_info_card" className="align_column">
                                    <div id="staff_info_card_name">
                                        <span>Ticket Sales</span>
                                    </div>
                                    <hr />
                                    <div id="event_selling_info" className="align_row">
                                        <span>Tickets Sold</span>
                                        <span>{totalSold}</span>
                                    </div>
                                    <div id="event_selling_info" className="align_row">
                                        <span>Total Capacity</span>
                                        <span>{totalCapacity}</span>
                                    </div>
                                    <div id="event_sold_tickets_container">
                                        <div id="event_sold_tickets" style={{ width: progressPct.toFixed(1) + '%' }} />
                                    </div>
                                    <div id="event_selling_info" className="align_row">
                                        <span>Progress</span>
                                        <span>{progressPct.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div id="staff_main_column_part" className="staff_event_statistics align_column">
                                <div id="staff_info_card" className="align_column">
                                    <div id="staff_info_card_name">
                                        <span>Revenue</span>
                                    </div>
                                    <hr />
                                    <div id="event_selling_info" className="align_row">
                                        <span>Min Ticket Price</span>
                                        <span>€{minPrice.toFixed(2)}</span>
                                    </div>
                                    <div id="event_selling_info" className="align_row">
                                        <span>Average per Ticket</span>
                                        <span>€{avgPerTicket.toFixed(2)}</span>
                                    </div>
                                    <div id="event_selling_info" className="align_row">
                                        <span>Total Revenue</span>
                                        <span>€{totalRevenue.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Tiers */}
                        <div id="staff_info_card" className="align_column details-ticket-tiers-card">
                            <div id="staff_info_card_name">
                                <span>Ticket Tiers</span>
                            </div>
                            <div id="staff_event_ticket_tier_list" className="align_column">
                                {event.tickets.length === 0 && (
                                    <span className="details-no-items">No ticket tiers defined.</span>
                                )}
                                {event.tickets.map(ticket => (
                                    <div id="staff_event_ticket_tier" className="align_column" key={ticket.id}>
                                        <div id="staff_event_card_input" className="align_column">
                                            <label>Tier Name</label>
                                            <span>{ticket.type}</span>
                                        </div>
                                        <div id="staff_info_card_input_group">
                                            <div id="staff_event_card_input" className="align_column">
                                                <label>
                                                    Quantity {ticket.sold > 0 && <span style={{fontSize: '0.85em', opacity: 0.7, fontWeight: 'normal', marginLeft: '6px'}}>({ticket.sold} sold)</span>}
                                                </label>
                                                <span>{ticket.quantity}</span>
                                            </div>
                                            <div id="staff_event_card_input" className="align_column">
                                                <label>Price</label>
                                                <span>€{ticket.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div id="staff_event_detail_controls">
                            <button onClick={() => navigate(`/event/${event.id}`)} style={{ backgroundColor: '#2ba84a', color: '#fff' }}>
                                View as Customer (Test)
                            </button>
                            <button onClick={() => navigate('/edit-event/' + event.id)}>Edit</button>
                            <button onClick={() => navigate('/event-orders/' + event.id)}>View Orders</button>
                            <button onClick={() => navigate('/event-statistics/' + event.id)}>Report</button>
                            <button>Export Attendees</button>
                            <button onClick={() => setShowCancelModal(true)}>Cancel</button>
                        </div>
                    </div>

                    {/* Right column — 28% */}
                    <div id="staff_main_column_part" className="align_column details-col-right">

                        {/* Event Poster */}
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Event Poster</span>
                            </div>
                            <div id="staff_choosen_event_poster">
                                {event.hasPoster ? (
                                    <img
                                        src={`/api/events/${event.id}/poster`}
                                        alt="Event poster"
                                        className="poster-img"
                                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.insertAdjacentText('afterend', 'No Poster'); }}
                                    />
                                ) : (
                                    'No Poster'
                                )}
                            </div>
                        </div>

                        {/* Event Type */}
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Event Type</span>
                            </div>
                            <hr />
                            <div id="staff_event_info_list" className="align_row">
                                {eventTypeTags.length === 0
                                    ? <span className="tag-empty">Not set</span>
                                    : eventTypeTags.map(t => (
                                        <span id="staff_event_info_button" key={t.id}>{t.name}</span>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Tags */}
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Tags</span>
                            </div>
                            <hr />
                            <div id="staff_event_info_list" className="align_row">
                                {regularTags.length === 0
                                    ? <span className="tag-empty">No tags</span>
                                    : regularTags.map(t => (
                                        <span id="staff_event_info_button" key={t.id}>{t.name}</span>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Statistics */}
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Statistics</span>
                            </div>
                            <hr />
                            <div id="event_selling_info" className="align_row">
                                <span>Available Tickets</span>
                                <span>{availableTickets}</span>
                            </div>
                            <div id="event_selling_info" className="align_row">
                                <span>Potential Revenue</span>
                                <span>€{potentialRevenue.toFixed(2)}</span>
                            </div>
                            <div id="event_selling_info" className="align_row">
                                <span>Revenue Left</span>
                                <span>€{revenueLeft.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EventDetails;
