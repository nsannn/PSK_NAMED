import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './EventList.css';
import './main.css';

const EVENT_TYPES = ['Concert', 'Festival', 'Conference', 'Exhibition', 'Sports'];
const TAG_OPTIONS  = ['Online', 'Outdoor', 'Indoor', 'Family'];
const SORT_OPTIONS = [
    { value: 'newest',     label: 'Newest' },
    { value: 'oldest',     label: 'Oldest' },
    { value: 'price-asc',  label: 'Price ↑' },
    { value: 'price-desc', label: 'Price ↓' },
    { value: 'name-asc',   label: 'Name A–Z' },
    { value: 'name-desc',  label: 'Name Z–A' },
];

function EventList() {
    const navigate = useNavigate();

    const [events, setEvents]   = useState([]);
    const [loading, setLoading] = useState(true);

    const [search,            setSearch]            = useState('');
    const [selectedEventType, setSelectedEventType] = useState('');
    const [selectedTags,      setSelectedTags]      = useState([]);
    const [minPrice,          setMinPrice]           = useState('');
    const [maxPrice,          setMaxPrice]           = useState('');
    const [dateFrom,          setDateFrom]           = useState('');
    const [dateTo,            setDateTo]             = useState('');
    const [locationFilter,    setLocationFilter]     = useState('');
    const [sort,              setSort]               = useState('newest');
    const [showSortMenu,      setShowSortMenu]       = useState(false);

    const debounceRef = useRef(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search)            params.set('search',    search);
        if (selectedEventType) params.set('eventType', selectedEventType);
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
        if (minPrice)          params.set('minPrice',  minPrice);
        if (maxPrice)          params.set('maxPrice',  maxPrice);
        if (dateFrom)          params.set('dateFrom',  dateFrom);
        if (dateTo)            params.set('dateTo',    dateTo);
        if (locationFilter)    params.set('location',  locationFilter);
        params.set('sort', sort);

        try {
            const data = await apiFetch('/api/events/myevents?' + params.toString());
            setEvents(data);
        } catch (err) {
            logger.error('Failed to fetch events', err);
        } finally {
            setLoading(false);
        }
    }, [search, selectedEventType, selectedTags, minPrice, maxPrice, dateFrom, dateTo, locationFilter, sort]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchEvents, 350);
        return () => clearTimeout(debounceRef.current);
    }, [fetchEvents]);

    const toggleEventType = (type) =>
        setSelectedEventType(prev => prev === type ? '' : type);

    const toggleTag = (tag) =>
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Newest';

    return (
        <>
            <div className="align_row">
                {/* Filter panel */}
                <div id="filters_menu" className="align_column">
                    <button id="close_button"><span>X</span></button>
                    <span id="filters_title">Filters</span>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Event Type</span>
                        <hr />
                        <div id="filter_options_container" className="align_row">
                            {EVENT_TYPES.map(type => (
                                <button
                                    key={type}
                                    id="filter_option"
                                    className={selectedEventType === type ? 'option_selected' : ''}
                                    onClick={() => toggleEventType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Ticket Price</span>
                        <hr />
                        <form className="align_row" onSubmit={e => e.preventDefault()}>
                            <input
                                type="number"
                                id="filter_price_min_input"
                                placeholder="Min"
                                value={minPrice}
                                min="0"
                                onChange={e => setMinPrice(e.target.value)}
                            />
                            <span id="filter_separator">-</span>
                            <input
                                type="number"
                                id="filter_price_max_input"
                                placeholder="Max"
                                value={maxPrice}
                                min="0"
                                onChange={e => setMaxPrice(e.target.value)}
                            />
                        </form>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Date</span>
                        <hr />
                        <form className="align_row" onSubmit={e => e.preventDefault()}>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            <span id="filter_separator">-</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </form>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Tags</span>
                        <hr />
                        <div id="filter_options_container" className="align_row">
                            {TAG_OPTIONS.map(tag => (
                                <button
                                    key={tag}
                                    id="filter_option"
                                    className={selectedTags.includes(tag) ? 'option_selected' : ''}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">City</span>
                        <hr />
                        <form className="align_column" onSubmit={e => e.preventDefault()}>
                            <input
                                type="text"
                                id="filter_city_input"
                                placeholder="e.g. Vilnius"
                                value={locationFilter}
                                onChange={e => setLocationFilter(e.target.value)}
                            />
                        </form>
                    </div>
                </div>

                {/* Event list */}
                <div id="event_list_main" className="align_column">
                    <div id="search_sort_menu" className="align_row">
                        <button id="filter_button_mobile" />

                        <form id="search_form" onSubmit={e => e.preventDefault()}>
                            <div id="search_wrapper" className="align_row">
                                <input
                                    type="text"
                                    id="search_input"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <button type="submit" id="search_button">🔍︎</button>
                            </div>
                        </form>

                        <div className="sort-container">
                            <button
                                id="sort_button"
                                className="align_row"
                                onClick={() => setShowSortMenu(s => !s)}
                            >
                                <span id="info_name">Sort</span>
                                <div id="info_separator" />
                                <span id="info_value">{currentSortLabel}</span>
                            </button>
                            <button
                                id="sort_button_mobile"
                                className="align_row"
                                onClick={() => setShowSortMenu(s => !s)}
                            />
                            {showSortMenu && (
                                <div id="sort_options_menu" className="sort-menu-open">
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            id="sort_option"
                                            onClick={() => { setSort(opt.value); setShowSortMenu(false); }}
                                            data-testid="sort-option-test"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div id="event_list">
                        {loading ? (
                            <p className="page-loading">Loading events...</p>
                        ) : events.length === 0 ? (
                            <p className="page-loading">No events found.</p>
                        ) : events.map(ev => {
                            const percentSold = ev.ticketsTotal > 0
                                ? (ev.ticketsSold / ev.ticketsTotal) * 100
                                : 0;
                            return (
                                <div id="event_card" key={ev.id}>
                                    <div id="event_card_poster">
                                        {ev.hasPoster ? (
                                            <img
                                                src={`/api/events/${ev.id}/poster`}
                                                alt="Event poster"
                                                className="event-card-poster-img"
                                                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'inline'; }}
                                            />
                                        ) : null}
                                        <span style={{ display: ev.hasPoster ? 'none' : 'inline' }}>No Poster</span>
                                    </div>
                                    <div id="event_card_information" className="align_column">
                                        <span id="event_name">{ev.name}</span>
                                        <span id="event_date">📅 {new Date(ev.date).toLocaleDateString()}</span>
                                        <span id="event_location">📍 {ev.location}</span>
                                        <span id="event_description">{ev.description}</span>
                                        <div id="event_selling_info_container" className="align_column">
                                            <div id="event_selling_info" className="align_row">
                                                <span>Tickets Sold</span>
                                                <span>{ev.ticketsSold}/{ev.ticketsTotal}</span>
                                            </div>
                                            <div id="event_sold_tickets_container">
                                                <div id="event_sold_tickets" style={{ width: percentSold + '%' }} />
                                            </div>
                                            <div id="event_selling_info" className="align_row">
                                                <span>Price from</span>
                                                <span>€{ev.price}</span>
                                            </div>
                                        </div>
                                        <div id="event_controls" className="align_row">
                                            <button onClick={() => navigate(`/event/${ev.id}`)}>View Event</button>
                                        </div>
                                        <span id="event_price">From {ev.price}€</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default EventList;
