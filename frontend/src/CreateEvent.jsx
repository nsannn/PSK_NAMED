import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './main.css';
import './CreateEvent.css';

function CreateEvent() {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    
    const [ticketTiers, setTicketTiers] = useState([
        { name: '', quantity: 0, price: 0 }
    ]);
    
    const [eventType, setEventType] = useState('Festival');
    const [tags, setTags] = useState(['Outdoor']);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddTier = () => {
        setTicketTiers([...ticketTiers, { name: '', quantity: 0, price: 0 }]);
    };

    const handleTierChange = (index, field, value) => {
        const newTiers = [...ticketTiers];
        newTiers[index][field] = value;
        setTicketTiers(newTiers);
    };

    const toggleTag = (tag) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        let combinedDate = new Date();
        if (date && time) {
            combinedDate = new Date(`${date}T${time}:00`);
        }

        const eventData = {
            title,
            description,
            location,
            date: combinedDate.toISOString(),
            eventType,
            tags,
            ticketTiers: ticketTiers.map(t => ({
                name: t.name,
                quantity: Number(t.quantity),
                price: Number(t.price)
            }))
        };

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                navigate('/');
            } else {
                console.error("Failed to create event:", await response.text());
                alert("Failed to create event");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error creating event");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <button className='btn-submit' onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </button>
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
                                <input type="text" placeholder="Enter event name" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            <div className='form-group-row align_row'>
                                <div className='form-group' style={{ flex: 1 }}>
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                </div>
                                <div className='form-group' style={{ flex: 1 }}>
                                    <label>Time</label>
                                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                                </div>
                            </div>

                            <div className='form-group'>
                                <label>Location</label>
                                <input type="text" placeholder="Enter location" value={location} onChange={(e) => setLocation(e.target.value)} />
                            </div>

                            <div className='form-group'>
                                <label>Description</label>
                                <textarea placeholder="Enter event description" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                            </div>
                        </div>

                        {/* Ticket Tiers Section */}
                        <div className='create-event-section align_column'>
                            <div className='section-header align_row'>
                                <h2>Ticket Tiers</h2>
                                <button className='btn-add-tier' onClick={handleAddTier}>+ Add Tier</button>
                            </div>

                            {ticketTiers.map((tier, index) => (
                                <div className='ticket-tier-box align_column' key={index}>
                                    <h3>Tier {index + 1}</h3>
                                    
                                    <div className='form-group'>
                                        <label>Tier Name</label>
                                        <input type="text" placeholder="e.g., VIP Sector, Standing, Close Seats" value={tier.name} onChange={(e) => handleTierChange(index, 'name', e.target.value)} />
                                    </div>

                                    <div className='form-group-row align_row'>
                                        <div className='form-group' style={{ flex: 1 }}>
                                            <label>Quantity</label>
                                            <input type="number" min="0" value={tier.quantity} onChange={(e) => handleTierChange(index, 'quantity', e.target.value)} />
                                        </div>
                                        <div className='form-group' style={{ flex: 1, position: 'relative' }}>
                                            <label>Price</label>
                                            <div className='input-with-symbol'>
                                                <input type="number" min="0" step="0.01" value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} />
                                                <span className='input-symbol'>€</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                {['Concert', 'Festival', 'Conference', 'Exhibition', 'Sports'].map(type => (
                                    <button 
                                        key={type}
                                        className={`pill ${eventType === type ? 'pill-selected' : ''}`}
                                        onClick={() => setEventType(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div className='create-event-section align_column'>
                            <h2>Tags</h2>
                            <div className='pill-container align_row'>
                                {['Online', 'Outdoor', 'Indoor', 'Family'].map(tag => (
                                    <button 
                                        key={tag}
                                        className={`pill ${tags.includes(tag) ? 'pill-selected' : ''}`}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </>
    );
}

export default CreateEvent;