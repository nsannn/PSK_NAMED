import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './main.css';
import './MyEventsList.css';

function MyEventsList() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/events/myevents')
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch events", err);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <div id="top_bar">
                <div id="site_logo">[Logo or Name]</div>
                <div id="nav_group">
                    <button className="option_selected" style={{backgroundColor: 'var(--quaternary-selected-color)'}}>My Events</button>
                    <button>Partners</button>
                    <button>Contacts</button>
                </div>
                <div id="account_group">
                    <button>Notifications</button>
                    <button>Sign In</button>
                    <button>Register</button>
                </div>
                <button id="menu_button">
                    <span>☰</span>
                </button>
            </div>

            <div className="align_row" style={{width: '100%', maxWidth: '100%', boxSizing: 'border-box'}}>
                <div id="filters_menu" className="align_column">
                    <span id="filters_title">Filters</span>
                    
                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Event Type</span>
                        <hr/>
                        <div id="filter_options_container" className="align_row">
                            <button id="filter_option">Concerts</button>
                            <button id="filter_option" className="option_selected">Festivals</button>
                        </div>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Ticket Price</span>
                        <hr/>
                        <form className="align_row">
                            <input type="number" id="filter_price_min_input" defaultValue={10} />
                            <span id="filter_separator">€</span>
                            <input type="number" id="filter_price_max_input" defaultValue={100} />
                            <span id="filter_separator">€</span>
                        </form>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Date</span>
                        <hr/>
                        <form className="align_row">
                            <input type="date" />
                            <span id="filter_separator">-</span>
                            <input type="date" />
                        </form>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">Tags</span>
                        <hr/>
                        <div id="filter_options_container" className="align_row">
                            <button id="filter_option">Online</button>
                            <button id="filter_option" className="option_selected">Outdoors</button>
                            <button id="filter_option">Indoors</button>
                        </div>
                    </div>

                    <div id="filter_container" className="align_column">
                        <span id="filter_name">City</span>
                        <hr/>
                        <form className="align_column">
                            <input type="text" id="filter_city_input" defaultValue="Vilnius" />
                        </form>
                    </div>
                </div>

                <div id="event_list_main" className="align_column" style={{flex: 1, width: 'auto', minWidth: 0, paddingRight: '1rem', boxSizing: 'border-box'}}>
                    <div id="search_sort_menu" className="align_row">
                        <form id="search_form" style={{flex: 1}}>
                            <div id="search_wrapper" className="align_row">
                                <input type="text" id="search_input" placeholder="Search..." style={{width: '100%'}}/>
                                <button type="submit" id="search_button" title="Search" style={{display: 'flex', alignItems: 'center'}}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </button>
                            </div>
                        </form>
                        <button style={{
                                backgroundColor: 'var(--tertiary-color)',
                                border: '3px solid var(--tertiary-border-color)',
                                color: 'var(--primary-text-color)',
                                padding: '0.4rem 1rem', 
                                borderRadius: '1rem',
                                fontWeight: 'bold',
                                marginLeft: '1rem',
                                cursor: 'pointer'
                            }} onClick={() => navigate('/create-event')}>+ Create Event</button>
                        <div id="sort_container" style={{marginLeft: '1rem'}}>
                            <button id="sort_button" className="align_row">
                                <span id="sort_text">Sort By</span>
                                <div id="sort_separator"></div>
                                <span id="sort_selected_text">New</span>
                            </button>
                        </div>
                    </div>

                    <div id='event_list' style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
                        {loading ? <p style={{gridColumn: '1 / -1', textAlign: 'center'}}>Loading events...</p> : events.length === 0 ? <p style={{gridColumn: '1 / -1', textAlign: 'center'}}>No events found.</p> : events.map(ev => {
                            const percentSold = ev.ticketsTotal > 0 ? (ev.ticketsSold / ev.ticketsTotal) * 100 : 0;
                            return (
                                <div id="event_card" key={ev.id} style={{flexDirection: 'column', height: '100%', width: '100%', margin: 0, boxSizing: 'border-box', minWidth: 0}}>
                                    <div className="align_row" style={{width: '100%', flex: 1, minWidth: 0}}>
                                        <div id="event_card_poster" style={{flexShrink: 0, width: '180px'}}>
                                            Event Poster
                                        </div>
                                        <div id="event_card_information" className="align_column" style={{justifyContent: 'space-between', flex: 1, minWidth: 0, wordBreak: 'break-word', overflow: 'hidden'}}>
                                            <span id="event_name">{ev.name}</span>
                                            <span id="event_date">Date: {ev.date}</span>
                                            <span id="event_location">Location: {ev.location}</span>
                                            <span id="event_description">{ev.description}</span>
                                            
                                            {/* Progress Bar & Details specific to My Events */}
                                            <div className="align_column" style={{marginTop: '1rem'}}>
                                                <div className="align_row" style={{justifyContent: 'space-between', fontSize: '0.9rem'}}>
                                                    <span>Tickets Sold</span>
                                                    <span>{ev.ticketsSold} / {ev.ticketsTotal}</span>
                                                </div>
                                                <div style={{height: '8px', backgroundColor: 'var(--tertiary-border-color)', borderRadius: '4px', margin: '0.3rem 0', overflow: 'hidden'}}>
                                                    <div style={{height: '100%', width: percentSold + '%', backgroundColor: 'var(--primary-text-color)'}}></div>
                                                </div>
                                                
                                                <div className="align_row" style={{justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem'}}>
                                                    <span>Revenue</span>
                                                    <span style={{fontWeight: 'bold'}}>€{ev.revenue}</span>
                                                </div>
                                                <div className="align_row" style={{justifyContent: 'space-between', marginTop: '0.2rem', fontSize: '0.9rem'}}>
                                                    <span>Price</span>
                                                    <span style={{fontWeight: 'bold'}}>€{ev.price} <span style={{textDecoration: 'underline', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'normal'}}>Edit</span></span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="align_row" style={{gap: '0.5rem', marginTop: '1rem'}}>
                                                <button style={{flex: 1, padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--quaternary-color)', border: 'none', color: 'var(--primary-text-color)', cursor: 'pointer'}}>Edit</button>
                                                <button style={{flex: 1, padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--quaternary-color)', border: 'none', color: 'var(--primary-text-color)', cursor: 'pointer'}}>Details</button>
                                                <button style={{flex: 1, padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'transparent', border: '2px solid var(--quaternary-color)', color: 'var(--primary-text-color)', cursor: 'pointer'}}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{textAlign: 'center', width: '100%', fontSize: '1.2rem', padding: '0.5rem 0', borderTop: '2px solid var(--tertiary-border-color)', marginTop: '0.5rem'}}>
                                        Tickets From: {ev.price}€
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

export default MyEventsList;
