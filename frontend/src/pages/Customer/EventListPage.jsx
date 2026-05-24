import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import './EventListPage.css';

const EVENT_TYPES = ['Concert', 'Festival', 'Conference', 'Exhibition', 'Sports'];
const TAG_OPTIONS  = ['Online', 'Outdoor', 'Indoor', 'Family'];

function EventListPage() {
    const navigate = useNavigate();

    const [events,  setEvents]  = useState([]);
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
            const data = await apiFetch('/api/events?' + params.toString());
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            setEvents([]);
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

    return (
        <div className="elp-page align_row">

            {/* Filter panel */}
            <div className="elp-filters align_column">
                <span className="elp-filters-title">Filters</span>

                <div className="elp-filter-group align_column">
                    <span className="elp-filter-name">Event Type</span>
                    <hr />
                    <div className="elp-filter-options align_row">
                        {EVENT_TYPES.map(type => (
                            <button
                                key={type}
                                className={`elp-filter-btn ${selectedEventType === type ? 'option_selected' : ''}`}
                                onClick={() => toggleEventType(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="elp-filter-group align_column">
                    <span className="elp-filter-name">Ticket Price</span>
                    <hr />
                    <div className="align_row elp-price-row">
                        <input
                            type="number"
                            className="elp-price-input"
                            placeholder="Min"
                            value={minPrice}
                            min="0"
                            onChange={e => setMinPrice(e.target.value)}
                        />
                        <span className="elp-separator">–</span>
                        <input
                            type="number"
                            className="elp-price-input"
                            placeholder="Max"
                            value={maxPrice}
                            min="0"
                            onChange={e => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>

                <div className="elp-filter-group align_column">
                    <span className="elp-filter-name">Date</span>
                    <hr />
                    <div className="align_row elp-price-row">
                        <input type="date" className="elp-date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        <span className="elp-separator">–</span>
                        <input type="date" className="elp-date-input" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
                    </div>
                </div>

                <div className="elp-filter-group align_column">
                    <span className="elp-filter-name">Tags</span>
                    <hr />
                    <div className="elp-filter-options align_row">
                        {TAG_OPTIONS.map(tag => (
                            <button
                                key={tag}
                                className={`elp-filter-btn ${selectedTags.includes(tag) ? 'option_selected' : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="elp-filter-group align_column">
                    <span className="elp-filter-name">City</span>
                    <hr />
                    <input
                        type="text"
                        className="elp-city-input"
                        placeholder="e.g. Vilnius"
                        value={locationFilter}
                        onChange={e => setLocationFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Event grid */}
            <div className="elp-main align_column">

                {/* Search + sort bar */}
                <div className="elp-search-bar align_row">
                    <input
                        type="text"
                        className="elp-search-input"
                        placeholder="Search events..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="elp-sort-select"
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="price-asc">Price ↑</option>
                        <option value="price-desc">Price ↓</option>
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                    </select>
                </div>

                {loading ? (
                    <p className="elp-empty">Loading events...</p>
                ) : events.length === 0 ? (
                    <p className="elp-empty">No events found.</p>
                ) : (
                    <div className="elp-grid">
                        {events.map(ev => (
                            <div
                                key={ev.id}
                                className="elp-card"
                                onClick={() => navigate(`/event/${ev.id}`)}
                            >
                                <div className="elp-card-poster">
                                    {ev.hasPoster ? (
                                        <img
                                            src={`/api/events/${ev.id}/poster`}
                                            alt="Event poster"
                                            className="elp-card-poster-img"
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="elp-card-no-poster">No Poster</span>
                                    )}
                                </div>
                                <div className="elp-card-body align_column">
                                    <span className="elp-card-title">{ev.name}</span>
                                    <span className="elp-card-meta">📅 {new Date(ev.date).toLocaleDateString()}</span>
                                    <span className="elp-card-meta">📍 {ev.location}</span>
                                    {ev.description && (
                                        <span className="elp-card-desc">{ev.description}</span>
                                    )}
                                    <div className="elp-card-footer">
                                        <span className="elp-card-price">From €{Number(ev.price).toFixed(2)}</span>
                                        <button className="elp-card-btn">Buy Tickets</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventListPage;
