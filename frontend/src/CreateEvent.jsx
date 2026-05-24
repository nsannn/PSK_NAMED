import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './CreateEvent.css';
import './main.css';

function CreateEvent() {
    const navigate = useNavigate();

    const [title,       setTitle]       = useState('');
    const [date,        setDate]        = useState('');
    const [time,        setTime]        = useState('');
    const [location,    setLocation]    = useState('');
    const [description, setDescription] = useState('');
    const [ticketTiers, setTicketTiers] = useState([{ name: '', quantity: 0, price: 0 }]);
    const [eventType,   setEventType]   = useState('Festival');
    const [tags,        setTags]        = useState(['Outdoor']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [posterFile,    setPosterFile]    = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);

    const handleAddTier = () =>
        setTicketTiers([...ticketTiers, { name: '', quantity: 0, price: 0 }]);

    const handleTierChange = (index, field, value) => {
        const newTiers = [...ticketTiers];
        if (field === 'quantity' || field === 'price') {
            // Clamp value to 0 or positive
            newTiers[index][field] = Math.max(0, Number(value));
        } else {
            newTiers[index][field] = value;
        }
        setTicketTiers(newTiers);
    };

    const toggleTag = (tag) =>
        setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);

    const handlePosterChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPosterFile(file);
        setPosterPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        let combinedDate = new Date();
        if (date && time)
            combinedDate = new Date(date + 'T' + time + ':00');

        const eventData = {
            title, description, location,
            date: combinedDate.toISOString(),
            eventType, tags,
            ticketTiers: ticketTiers.map(t => ({
                name: t.name,
                quantity: Number(t.quantity),
                price: Number(t.price)
            }))
        };

        try {
            const created = await apiFetch('/api/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });

            if (posterFile) {
                const form = new FormData();
                form.append('file', posterFile);
                await apiFetch(`/api/events/${created.id}/poster`, { method: 'POST', body: form });
            }
            navigate('/my-events');
        } catch (error) {
            logger.error('Error submitting form:', error);
            alert('Error creating event: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="align_column">
                <div id="staff_main_row_part">
                    <span id="staff_page_name">Create New Event</span>
                </div>
                <div id="staff_main_row_part">
                    {/* Left column */}
                    <div id="staff_main_column_part" className="align_column ce-col-left">
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name"><span>Event Details</span></div>
                            <hr />
                            <div id="staff_event_card_input" className="align_column">
                                <label htmlFor="staff_event_name">Event Name</label>
                                <input id="staff_event_name" type="text" placeholder="Event Name" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div id="staff_info_card_input_group">
                                <div id="staff_event_card_input" className="align_column">
                                    <label htmlFor="staff_event_date">Date</label>
                                    <input id="staff_event_date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div id="staff_event_card_input" className="align_column">
                                    <label htmlFor="staff_event_time">Time</label>
                                    <input id="staff_event_time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                                </div>
                            </div>
                            <div id="staff_event_card_input" className="align_column">
                                <label htmlFor="staff_event_location">Location</label>
                                <input id="staff_event_location" type="text" placeholder="Event Location" value={location} onChange={e => setLocation(e.target.value)} />
                            </div>
                            <div id="staff_event_card_input" className="align_column">
                                <label htmlFor="staff_event_description">Description</label>
                                <textarea id="staff_event_description" placeholder="Event Description" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </div>

                        <div id="staff_info_card" className="align_column ce-ticket-tiers-card">
                            <div id="staff_info_card_name">
                                <span>Ticket Tiers</span>
                                <button onClick={handleAddTier}>+ Add Tier</button>
                            </div>
                            <div id="staff_event_ticket_tier_list" className="align_column ce-tier-list">
                                {ticketTiers.map((tier, index) => (
                                    <div id="staff_event_ticket_tier" className="align_column" key={index}>
                                        <div id="staff_event_card_input" className="align_column">
                                            <label htmlFor={`tier_name_${index}`}>Tier Name</label>
                                            <input id={`tier_name_${index}`} type="text" placeholder="Tier Name" value={tier.name} onChange={e => handleTierChange(index, 'name', e.target.value)} />
                                        </div>
                                        <div id="staff_info_card_input_group">
                                            <div id="staff_event_card_input" className="align_column">
                                                <label htmlFor={`tier_qty_${index}`}>Quantity</label>
                                                <input id={`tier_qty_${index}`} type="number" min={0} step={1} value={tier.quantity} onChange={e => {
                                                    const value = e.target.value;

                                                    if (value === '' || Number(value) >= 0) {
                                                        handleTierChange(index, 'quantity', value);
                                                    }
                                                }} />
                                            </div>
                                            <div id="staff_event_card_input" className="align_column">
                                                <label htmlFor={`tier_price_${index}`}>Price</label>
                                                <input id={`tier_price_${index}`} type="number" min={0} step={0.01} value={tier.price} onChange={e => {
                                                    const value = e.target.value;

                                                    if (value === '' || Number(value) >= 0) {
                                                        handleTierChange(index, 'price', value);
                                                    }
                                                }} />
                                            </div>
                                        </div>
                                        {ticketTiers.length > 1 && (
                                            <button id="staff_event_ticket_tier_delete_button" onClick={() => {
                                                const newTiers = [...ticketTiers];
                                                newTiers.splice(index, 1);
                                                setTicketTiers(newTiers);
                                            }}>Delete</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div id="staff_main_column_part" className="align_column ce-col-right">
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name"><span>Event Poster</span></div>
                            <div id="staff_choosen_event_poster">
                                {posterPreview ? (
                                    <img src={posterPreview} alt="Poster preview" className="ce-poster-img" />
                                ) : (
                                    'Upload Event Poster'
                                )}
                            </div>
                            <label id="staff_event_poster_button" htmlFor="staff_event_poster_file">
                                {posterFile ? 'Change File' : 'Choose File'}
                            </label>
                            <input
                                type="file"
                                id="staff_event_poster_file"
                                className="ce-file-input"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePosterChange}
                            />
                        </div>

                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name"><span>Event Type</span></div>
                            <hr />
                            <div id="staff_event_info_list" className="align_row ce-type-tags">
                                {['Concert', 'Festival', 'Conference', 'Exhibition', 'Sports'].map(type => (
                                    <button
                                        key={type}
                                        id="staff_event_info_button"
                                        className={eventType === type ? 'option_selected' : ''}
                                        onClick={() => setEventType(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name"><span>Tags</span></div>
                            <hr />
                            <div id="staff_event_info_list" className="align_row ce-type-tags">
                                {['Online', 'Outdoor', 'Indoor', 'Family'].map(tag => (
                                    <button
                                        key={tag}
                                        id="staff_event_info_button"
                                        className={tags.includes(tag) ? 'option_selected' : ''}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button id="staff_event_controls" onClick={() => navigate('/my-events')}>Cancel</button>
                        <button id="staff_event_controls" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateEvent;
