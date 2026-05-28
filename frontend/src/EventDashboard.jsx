import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './EventDashboard.css';
import './main.css';

const SORT_OPTIONS = [
    { value: 'revenue-desc', label: 'Revenue ↓' },
    { value: 'revenue-asc',  label: 'Revenue ↑' },
    { value: 'fill-desc',    label: 'Fill Rate ↓' },
    { value: 'fill-asc',     label: 'Fill Rate ↑' },
    { value: 'date-desc',    label: 'Newest' },
    { value: 'date-asc',     label: 'Oldest' },
    { value: 'name-asc',     label: 'Name A–Z' },
];

function StatRow({ label, value }) {
    return (
        <div id="event_selling_info" className="align_row">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function KpiCard({ title, children }) {
    return (
        <div className="ed-kpi-card">
            <span className="ed-kpi-title">{title}</span>
            <hr />
            {children}
        </div>
    );
}

function EventDashboard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('revenue-desc');

    useEffect(() => {
        apiFetch('/api/events/myevents')
            .then(data => { setEvents(data); setLoading(false); })
            .catch(err => { logger.error('Failed to fetch dashboard events', err); setLoading(false); });
    }, []);

    if (loading) return <div className="page-loading">Loading dashboard...</div>;

    const totalEvents   = events.length;
    const totalSold     = events.reduce((s, e) => s + e.ticketsSold, 0);
    const totalCapacity = events.reduce((s, e) => s + e.ticketsTotal, 0);
    const totalRevenue  = events.reduce((s, e) => s + (e.revenueAmount ?? 0), 0);
    const overallFill   = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
    const now           = new Date();

    const topByRevenue = events.length > 0
        ? events.reduce((a, b) => (a.revenueAmount ?? 0) >= (b.revenueAmount ?? 0) ? a : b)
        : null;
    const topByFill = events.length > 0
        ? events.reduce((a, b) => {
            const fa = a.ticketsTotal > 0 ? a.ticketsSold / a.ticketsTotal : 0;
            const fb = b.ticketsTotal > 0 ? b.ticketsSold / b.ticketsTotal : 0;
            return fa >= fb ? a : b;
        })
        : null;

    const sorted = [...events].sort((a, b) => {
        switch (sort) {
            case 'revenue-desc': return (b.revenueAmount ?? 0) - (a.revenueAmount ?? 0);
            case 'revenue-asc':  return (a.revenueAmount ?? 0) - (b.revenueAmount ?? 0);
            case 'fill-desc': {
                const fa = a.ticketsTotal > 0 ? a.ticketsSold / a.ticketsTotal : 0;
                const fb = b.ticketsTotal > 0 ? b.ticketsSold / b.ticketsTotal : 0;
                return fb - fa;
            }
            case 'fill-asc': {
                const fa = a.ticketsTotal > 0 ? a.ticketsSold / a.ticketsTotal : 0;
                const fb = b.ticketsTotal > 0 ? b.ticketsSold / b.ticketsTotal : 0;
                return fa - fb;
            }
            case 'date-asc':  return new Date(a.date) - new Date(b.date);
            case 'date-desc': return new Date(b.date) - new Date(a.date);
            case 'name-asc':  return a.name.localeCompare(b.name);
            default:          return 0;
        }
    });

    return (
        <div className="align_column ed-page">

            {/* Page title */}
            <div id="staff_main_row_part">
                <span id="staff_page_name">Event Dashboard</span>
            </div>

            {/* KPI grid */}
            <div className="ed-kpi-grid">
                <KpiCard title="Total Events">
                    <StatRow label="All Events" value={totalEvents} />
                    <StatRow label="Upcoming"   value={events.filter(e => new Date(e.date) >= now).length} />
                    <StatRow label="Past"       value={events.filter(e => new Date(e.date) < now).length} />
                </KpiCard>

                <KpiCard title="Total Revenue">
                    <StatRow label="Earned"        value={`€${totalRevenue.toFixed(2)}`} />
                    <StatRow label="Avg per Event" value={`€${totalEvents > 0 ? (totalRevenue / totalEvents).toFixed(2) : '0.00'}`} />
                </KpiCard>

                <KpiCard title="Ticket Sales">
                    <StatRow label="Sold"           value={totalSold} />
                    <StatRow label="Total Capacity" value={totalCapacity} />
                    <div id="event_sold_tickets_container">
                        <div id="event_sold_tickets" style={{ width: overallFill.toFixed(1) + '%' }} />
                    </div>
                    <StatRow label="Overall Fill Rate" value={`${overallFill.toFixed(1)}%`} />
                </KpiCard>

                <KpiCard title="Top Event">
                    {!topByRevenue ? (
                        <span className="ed-empty">No events yet.</span>
                    ) : (
                        <>
                            <div className="ed-top-entry">
                                <span className="ed-top-category">By Revenue</span>
                                <span className="ed-top-name">{topByRevenue.name}</span>
                                <span className="ed-top-value">€{(topByRevenue.revenueAmount ?? 0).toFixed(2)}</span>
                            </div>
                            <hr className="ed-top-hr" />
                            <div className="ed-top-entry">
                                <span className="ed-top-category">By Fill Rate</span>
                                <span className="ed-top-name">{topByFill.name}</span>
                                <span className="ed-top-value">
                                    {topByFill.ticketsTotal > 0
                                        ? ((topByFill.ticketsSold / topByFill.ticketsTotal) * 100).toFixed(1)
                                        : '0.0'}%
                                </span>
                            </div>
                        </>
                    )}
                </KpiCard>
            </div>

            {/* All Events list */}
            <div className="ed-all-events">
                <div id="staff_info_card" className="align_column">

                    <div id="staff_info_card_name" className="ed-all-events-header">
                        <span>All Events</span>
                        <div className="align_row ed-sort-controls">
                            <span className="ed-sort-label">Sort:</span>
                            <select
                                className="ed-sort-select"
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                            >
                                {SORT_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <hr />

                    {sorted.length === 0 && (
                        <span className="ed-empty">No events found.</span>
                    )}

                    <div className="align_column ed-events-list">
                        {sorted.map(ev => {
                            const fill = ev.ticketsTotal > 0
                                ? (ev.ticketsSold / ev.ticketsTotal) * 100
                                : 0;
                            return (
                                <div
                                    key={ev.id}
                                    className="ed-event-row"
                                    onClick={() => navigate('/event-details/' + ev.id)}
                                >
                                    <div className="ed-name-col">
                                        <div className="ed-event-header">
                                            <span className="ed-event-name">{ev.name}</span>
                                            <span className="ed-event-meta">
                                                {new Date(ev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {ev.location ? ` · ${ev.location}` : ''}
                                            </span>
                                        </div>
                                        <div className="ed-tiers-breakdown">
                                            {(ev.tiers && ev.tiers.length > 0) ? ev.tiers.map((tier, i) => {
                                                const tierFill = tier.quantity > 0 ? (tier.sold / tier.quantity) * 100 : 0;
                                                return (
                                                    <div className="ed-tier-row" key={i}>
                                                        <div className="ed-tier-info">
                                                            <span className="ed-tier-name">{tier.name}</span>
                                                            <span className="ed-tier-count">{tier.sold}/{tier.quantity}</span>
                                                        </div>
                                                        <div className="ed-event-bar-track ed-tier-bar-track">
                                                            <div className="ed-event-bar-fill" style={{ width: tierFill.toFixed(1) + '%' }} />
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <span className="ed-tier-none">No tiers</span>
                                            )}
                                        </div>
                                        <div className="ed-fill-label">
                                            <span>Overall <strong>{fill.toFixed(1)}%</strong></span>
                                        </div>
                                    </div>
                                    <div className="ed-stats-col">
                                        <div className="ed-stat-chip">
                                            <span className="ed-stat-label">Tickets</span>
                                            <span className="ed-stat-value">{ev.ticketsSold} / {ev.ticketsTotal}</span>
                                        </div>
                                        <div className="ed-stat-chip">
                                            <span className="ed-stat-label">Revenue</span>
                                            <span className="ed-stat-value">€{(ev.revenueAmount ?? 0).toFixed(2)}</span>
                                        </div>
                                        <div className="ed-stat-chip">
                                            <span className="ed-stat-label">From</span>
                                            <span className="ed-stat-value">€{Number(ev.price).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>

        </div>
    );
}

export default EventDashboard;
