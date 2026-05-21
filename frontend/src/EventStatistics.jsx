import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './EventStatistics.css';
import './main.css';

const EVENT_TYPES = ['Concert', 'Festival', 'Conference', 'Exhibition', 'Sports'];

function StatRow({ label, value }) {
    return (
        <div id="event_selling_info" className="align_row">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function InfoCard({ title, children, className = '' }) {
    return (
        <div className={`es-info-card ${className}`}>
            <span className="es-info-card-title">{title}</span>
            <hr className="es-card-hr" />
            {children}
        </div>
    );
}

function EventStatistics() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/api/events/' + id)
            .then(data => { setEvent(data); setLoading(false); })
            .catch(err => { logger.error('Failed to fetch event statistics', err); setLoading(false); });
    }, [id]);

    if (loading) return <div className="page-loading">Loading statistics...</div>;
    if (!event) return <div className="page-loading">Event not found.</div>;

    const tickets = event.tickets ?? [];

    const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
    const totalCapacity = tickets.reduce((s, t) => s + t.quantity, 0);
    const totalRevenue = tickets.reduce((s, t) => s + t.sold * t.price, 0);
    const potentialRev = tickets.reduce((s, t) => s + t.quantity * t.price, 0);
    const fillRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
    const avgPerTicket = totalSold > 0 ? totalRevenue / totalSold : 0;
    const revenueLeft = potentialRev - totalRevenue;
    const minPrice = tickets.length > 0 ? Math.min(...tickets.map(t => t.price)) : 0;
    const maxPrice = tickets.length > 0 ? Math.max(...tickets.map(t => t.price)) : 0;
    const avgPrice = tickets.length > 0 ? tickets.reduce((s, t) => s + t.price, 0) / tickets.length : 0;
    const revFillPct = potentialRev > 0 ? (totalRevenue / potentialRev) * 100 : 0;

    const tierStats = tickets.map(t => ({
        ...t,
        fill: t.quantity > 0 ? (t.sold / t.quantity) * 100 : 0,
        revenue: t.sold * t.price,
        share: totalRevenue > 0 ? (t.sold * t.price / totalRevenue) * 100 : 0,
    }));

    const topRevenueT = tierStats.length > 0 ? tierStats.reduce((a, b) => a.revenue >= b.revenue ? a : b) : null;
    const topFillT = tierStats.length > 0 ? tierStats.reduce((a, b) => a.fill >= b.fill ? a : b) : null;

    const eventTypeTags = (event.tags ?? []).filter(t => EVENT_TYPES.includes(t.name));
    const regularTags = (event.tags ?? []).filter(t => !EVENT_TYPES.includes(t.name));

    const formattedDate = new Date(event.date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    return (
        <div className="align_column es-page">

            {/* Header */}
            <div className="es-header">
                <span className="es-event-title">{event.title}</span>
                <span className="es-page-label">Event Statistics</span>
            </div>

            {/* Row 1: three KPI cards */}
            <div className="es-row">
                <InfoCard title="Sales Overview" className="es-kpi">
                    <StatRow label="Tickets Sold" value={totalSold} />
                    <StatRow label="Total Capacity" value={totalCapacity} />
                    <StatRow label="Available" value={totalCapacity - totalSold} />
                    <div id="event_sold_tickets_container" className="es-progress">
                        <div id="event_sold_tickets" style={{ width: fillRate.toFixed(1) + '%' }} />
                    </div>
                    <StatRow label="Fill Rate" value={`${fillRate.toFixed(1)}%`} />
                </InfoCard>

                <InfoCard title="Revenue Overview" className="es-kpi">
                    <StatRow label="Total Revenue" value={`€${totalRevenue.toFixed(2)}`} />
                    <StatRow label="Potential Revenue" value={`€${potentialRev.toFixed(2)}`} />
                    <StatRow label="Revenue Left" value={`€${revenueLeft.toFixed(2)}`} />
                    <div id="event_sold_tickets_container" className="es-progress">
                        <div id="event_sold_tickets" style={{ width: revFillPct.toFixed(1) + '%' }} />
                    </div>
                    <StatRow label="Avg per Ticket" value={`€${avgPerTicket.toFixed(2)}`} />
                </InfoCard>

                <InfoCard title="Pricing" className="es-kpi">
                    <StatRow label="Min Price" value={`€${minPrice.toFixed(2)}`} />
                    <StatRow label="Max Price" value={`€${maxPrice.toFixed(2)}`} />
                    <StatRow label="Avg Price" value={`€${avgPrice.toFixed(2)}`} />
                    <StatRow label="Tier Count" value={tickets.length} />
                </InfoCard>
            </div>

            {/* Row 2: Per-Tier Breakdown */}
            <div className="es-section">
                <InfoCard title="Per-Tier Breakdown">
                    {tierStats.length === 0 ? (
                        <span className="es-empty">No ticket tiers defined.</span>
                    ) : (
                        <div className="es-tier-list">
                            {tierStats.map(tier => (
                                <div key={tier.id} className="es-tier-item">
                                    <div className="es-tier-top">
                                        <span className="es-tier-name">{tier.type}</span>
                                        {[
                                            { label: 'Sold / Total', value: `${tier.sold} / ${tier.quantity}` },
                                            { label: 'Price', value: `€${tier.price.toFixed(2)}` },
                                            { label: 'Revenue', value: `€${tier.revenue.toFixed(2)}` },
                                            { label: 'Rev. Share', value: `${tier.share.toFixed(1)}%` },
                                        ].map(s => (
                                            <div key={s.label} className="es-tier-stat">
                                                <span className="es-tier-stat-label">{s.label}</span>
                                                <span className="es-tier-stat-value">{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="es-tier-bar-row">
                                        <div id="event_sold_tickets_container" className="es-tier-bar">
                                            <div id="event_sold_tickets" style={{ width: tier.fill.toFixed(1) + '%' }} />
                                        </div>
                                        <span className="es-tier-fill-text">{tier.fill.toFixed(1)}% filled</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </InfoCard>
            </div>

            {/* Row 3: Top Performer + Event Info */}
            <div className="es-row">
                <InfoCard title="Top Performer" className="es-flex-1">
                    {!topRevenueT ? (
                        <span className="es-empty">No tiers to compare.</span>
                    ) : (
                        <>
                            <div className="es-performer-entry">
                                <span className="es-performer-label">Highest Revenue Tier</span>
                                <div className="es-performer-row">
                                    <span className="es-performer-name">{topRevenueT.type}</span>
                                    <span className="es-performer-value">€{topRevenueT.revenue.toFixed(2)}</span>
                                </div>
                            </div>
                            <hr className="es-performer-hr" />
                            <div className="es-performer-entry">
                                <span className="es-performer-label">Best Fill Rate Tier</span>
                                <div className="es-performer-row">
                                    <span className="es-performer-name">{topFillT.type}</span>
                                    <span className="es-performer-value">{topFillT.fill.toFixed(1)}%</span>
                                </div>
                            </div>
                        </>
                    )}
                </InfoCard>

                <InfoCard title="Event Info" className="es-flex-2">
                    <StatRow label="Date" value={formattedDate} />
                    <StatRow label="Location" value={event.location} />
                    {eventTypeTags.length > 0 && (
                        <div id="event_selling_info" className="align_row es-tag-row">
                            <span className="es-tag-label">Type</span>
                            <div className="es-tag-list">
                                {eventTypeTags.map(t => (
                                    <span id="staff_event_info_button" key={t.id}>{t.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {regularTags.length > 0 && (
                        <div id="event_selling_info" className="align_row es-tag-row">
                            <span className="es-tag-label">Tags</span>
                            <div className="es-tag-list">
                                {regularTags.map(t => (
                                    <span id="staff_event_info_button" key={t.id}>{t.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </InfoCard>
            </div>

            {/* Back button */}
            <div className="es-section">
                <button id="staff_event_controls" onClick={() => navigate('/event-details/' + id)}>
                    Back to Event Details
                </button>
            </div>

        </div>
    );
}

export default EventStatistics;
