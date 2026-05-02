import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './main.css';
import './CreateEvent.css';

function CreateEvent() {
    const navigate = useNavigate();

    return (
        <>
            <div id='top_bar'>
                <div id='site_logo'>[Logo or Name]</div>
                <div id='nav_group' className='align_row'>
                    <button className='option_selected' style={{backgroundColor: 'var(--quaternary-selected-color)'}} onClick={() => navigate('/')}>My Events</button>
                    <button>Partners</button>
                    <button>Contacts</button>
                </div>
                <div id='account_group' className='align_row'>
                    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-detail-color)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                    <button>Sign In</button>
                    <button>Register</button>
                </div>
            </div>

            <div className='create-event-wrapper align_column'>
                {/* Header Sub-bar */}
                <div className='create-event-header align_row'>
                    <h1>Create New Event</h1>
                    <div className='create-event-header-actions'>
                        <button className='btn-cancel' onClick={() => navigate('/')}>Cancel</button>
                        <button className='btn-submit'>Create Event</button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className='create-event-main-grid'>
                    {/* LEFT COLUMN */}
                    <div className='create-event-column-left align_column'>
                        
                        {/* Event Details Section */}
                        <div className='create-event-section align_column'>
                            <h2>Event Details</h2>
                            
                            <div className='form-group'>
                                <label>Event Name</label>
                                <input type="text" placeholder="Enter event name" />
                            </div>

                            <div className='form-group-row align_row'>
                                <div className='form-group' style={{ flex: 1 }}>
                                    <label>Date</label>
                                    <input type="text" />
                                </div>
                                <div className='form-group' style={{ flex: 1 }}>
                                    <label>Time</label>
                                    <input type="text" />
                                </div>
                            </div>

                            <div className='form-group'>
                                <label>Location</label>
                                <input type="text" placeholder="Enter location" />
                            </div>

                            <div className='form-group'>
                                <label>Description</label>
                                <textarea placeholder="Enter event description"></textarea>
                            </div>
                        </div>

                        {/* Ticket Tiers Section */}
                        <div className='create-event-section align_column'>
                            <div className='section-header align_row'>
                                <h2>Ticket Tiers</h2>
                                <button className='btn-add-tier'>+ Add Tier</button>
                            </div>

                            <div className='ticket-tier-box align_column'>
                                <h3>Tier 1</h3>
                                
                                <div className='form-group'>
                                    <label>Tier Name</label>
                                    <input type="text" placeholder="e.g., VIP Sector, Standing, Close Seats" />
                                </div>

                                <div className='form-group-row align_row'>
                                    <div className='form-group' style={{ flex: 1 }}>
                                        <label>Quantity</label>
                                        <input type="number" defaultValue={0} />
                                    </div>
                                    <div className='form-group' style={{ flex: 1, position: 'relative' }}>
                                        <label>Price</label>
                                        <div className='input-with-symbol'>
                                            <input type="number" defaultValue={0} />
                                            <span className='input-symbol'>€</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className='create-event-column-right align_column'>
                        
                        {/* Event Poster Section */}
                        <div className='create-event-section align_column'>
                            <h2>Event Poster</h2>
                            <div className='poster-upload-box align_column'>
                                <span>Upload Event Poster</span>
                            </div>
                            <button className='btn-upload'>Choose File</button>
                        </div>

                        {/* Event Type Section */}
                        <div className='create-event-section align_column'>
                            <h2>Event Type</h2>
                            <div className='pill-container align_row'>
                                <button className='pill'>Concert</button>
                                <button className='pill pill-selected'>Festival</button>
                                <button className='pill'>Conference</button>
                                <button className='pill'>Exhibition</button>
                                <button className='pill'>Sports</button>
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div className='create-event-section align_column'>
                            <h2>Tags</h2>
                            <div className='pill-container align_row'>
                                <button className='pill'>Online</button>
                                <button className='pill pill-selected'>Outdoor</button>
                                <button className='pill'>Indoor</button>
                                <button className='pill'>Family</button>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </>
    );
}

export default CreateEvent;