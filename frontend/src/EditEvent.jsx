import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { logger } from './utils/logger';
import './EditEvent.css';
import './main.css';

function EditEvent() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    
    const [ticketTiers, setTicketTiers] = useState([]);
    
    const [eventType, setEventType] = useState('');
    const [tags, setTags] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [showSaveError, setShowSaveError] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [hasPoster,     setHasPoster]     = useState(false);
    const [posterFile,    setPosterFile]    = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        apiFetch('/api/events/' + id)
            .then(data => {
                setTitle(data.title || data.name || '');
                if (data.date) {
                    const d = new Date(data.date);
                    setDate(d.toISOString().substring(0, 10));
                    setTime(d.toISOString().substring(11, 16));
                }
                setLocation(data.location || '');
                setDescription(data.description || '');
                setEventType(data.eventType || 'Festival');
                setTags(data.tags ? data.tags.map(t => t.name) : []);
                setHasPoster(data.hasPoster ?? false);
                setTicketTiers(data.tickets && data.tickets.length > 0 ? data.tickets.map(t => ({
                    name: t.type || t.name || '',
                    quantity: t.quantity || 0,
                    price: t.price || 0,
                    id: t.id
                })) : [{ name: '', quantity: 0, price: 0 }]);
            })
            .catch(err => {
                logger.error("Failed to fetch event for edit", err);
                alert("Failed to load event data.");
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleAddTier = () => {
        setTicketTiers([...ticketTiers, { name: '', quantity: 0, price: 0 }]);
    };

    const handleTierChange = (index, field, value) => {
        const newTiers = [...ticketTiers];
        if (field === 'quantity') {
            newTiers[index][field] = value.replace(/[^0-9]/g, '');
        } else if (field === 'price') {
            let clean = value.replace(/[^0-9.]/g, '');
            const parts = clean.split('.');
            if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
            newTiers[index][field] = clean;
        } else {
            newTiers[index][field] = value;
        }
        setTicketTiers(newTiers);
    };

    const toggleTag = (tag) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handlePosterChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPosterFile(file);
        setPosterPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        const newErrors = {};

        if (!(title || '').trim()) newErrors.title = "Event Name is required.";
        if (!date) newErrors.date = "Date is required.";
        if (!time) newErrors.time = "Time is required.";
        if (!(location || '').trim()) newErrors.location = "Location is required.";
        if (!(description || '').trim()) newErrors.description = "Description is required.";
        if (!eventType) newErrors.eventType = "Event Type is required.";
        if (tags.length === 0) newErrors.tags = "At least one tag is required.";
        if (!hasPoster && !posterFile) newErrors.poster = "Event Poster is required.";

        if (ticketTiers.length === 0) {
            newErrors.tickets = "At least one ticket tier is required.";
        } else {
            const tierErrors = [];
            let hasTierError = false;
            for (let i = 0; i < ticketTiers.length; i++) {
                const tier = ticketTiers[i];
                const tErr = {};
                if (!(tier.name || '').trim()) tErr.name = "Tier Name is required.";
                if (tier.quantity === '' || Number(tier.quantity) <= 0) tErr.quantity = "Quantity must be greater than 0.";
                if (tier.price === '' || Number(tier.price) <= 0) tErr.price = "Price must be greater than 0.";
                tierErrors.push(tErr);
                if (Object.keys(tErr).length > 0) hasTierError = true;
            }
            if (hasTierError) newErrors.tiers = tierErrors;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setShowSaveError(true);
            setTimeout(() => setShowSaveError(false), 1000);
            return;
        }
        setErrors({});
        setIsSubmitting(true);
        
        let combinedDate = new Date();
        if (date && time) {
            combinedDate = new Date(date + 'T' + time + ':00');
        }

        const eventData = {
            id,
            title,
            description,
            location,
            date: combinedDate.toISOString(),
            eventType,
            tags,
            ticketTiers: ticketTiers.map(t => ({
                id: t.id,
                name: t.name,
                quantity: Number(t.quantity),
                price: Number(t.price)
            }))
        };

        try {
            await apiFetch('/api/events/' + id, {
                method: 'PUT',
                body: JSON.stringify(eventData)
            });

            if (posterFile) {
                const form = new FormData();
                form.append('file', posterFile);
                await apiFetch(`/api/events/${id}/poster`, { method: 'POST', body: form });
            }
            navigate('/');
        } catch (error) {
            logger.error("Error submitting form:", error);
            alert("Error updating event");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await apiFetch('/api/events/' + id, {
                method: 'DELETE'
            });
            navigate('/');
        } catch (error) {
            logger.error("Error deleting event:", error);
            alert("Error deleting event");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (isLoading) {
        return <div className="page-loading">Loading event details...</div>;
    }

    return (
        <>
            {showDeleteModal && (
                <>
                    <div id="transparent_panel" onClick={() => setShowDeleteModal(false)}></div>
                    <div id="delete_confirmation_window" className="align_column">
                        <span id="window_name">Delete Event?</span>
                        <hr />
                        <span id="window_info">Are you sure you want to delete {title}?</span>
                        <span id="window_small_info">This action cannot be undone. All event data will be lost.</span>
                        <div id="delete_controls" className="align_row">
                            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting} data-testid="confirm_delete">{isDeleting ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </>
            )}

            <div className="align_column">
                <div id="staff_main_row_part">
                    <span id="staff_page_name">Edit Event</span>
                </div>
                <div id="staff_main_row_part">
                    <div id="staff_main_column_part" className="align_column edit-event-main-column-left">
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Event Details</span>
                            </div>
                            <hr/>
                            <div id="staff_event_card_input" className="align_column">
                                <label htmlFor="staff_event_name">Event Name</label>
                                <input id="staff_event_name" type="text" placeholder="Event Name" value={title} onChange={(e) => setTitle(e.target.value)} className={errors.title ? "input-error" : ""} />
                                {errors.title && <span className="field-error-text">{errors.title}</span>}
                            </div>
                            <div id="staff_info_card_input_group">
                                <div id="staff_event_card_input" className="align_column">
                                    <label htmlFor="staff_event_date">Date</label>
                                    <input id="staff_event_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={errors.date ? "input-error" : ""} />
                                    {errors.date && <span className="field-error-text">{errors.date}</span>}
                                </div>
                                <div id="staff_event_card_input" className="align_column">
                                    <label htmlFor="staff_event_time">Time</label>
                                    <input id="staff_event_time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={errors.time ? "input-error" : ""} />
                                    {errors.time && <span className="field-error-text">{errors.time}</span>}
                                </div>
                            </div>
                            <div id="staff_event_card_input" className="align_column">
                                <label htmlFor="staff_event_location">Location</label>
                                <input id="staff_event_location" type="text" placeholder="Event Location" value={location} onChange={(e) => setLocation(e.target.value)} className={errors.location ? "input-error" : ""} />
                                {errors.location && <span className="field-error-text">{errors.location}</span>}
                            </div>
                            <div id="staff_event_card_input" className="align_column">
                                <label htmlFor="staff_event_description">Description</label>
                                <textarea id="staff_event_description" placeholder="Event Description" value={description} onChange={(e) => setDescription(e.target.value)} className={errors.description ? "input-error" : ""}></textarea>
                                {errors.description && <span className="field-error-text">{errors.description}</span>}
                            </div>
                        </div>

                        <div id="staff_info_card" className="align_column edit-event-info-card-scrollable">
                            <div id="staff_info_card_name">
                                <span>Ticket Tiers</span>
                                <button onClick={handleAddTier}>+ Add Tier</button>
                            </div>
                            {errors.tickets && <span className="field-error-text" style={{margin: '0.5rem auto'}}>{errors.tickets}</span>}
                            <div id="staff_event_ticket_tier_list" className="align_column edit-event-tier-list">
                                {ticketTiers.map((tier, index) => (
                                    <div id="staff_event_ticket_tier" className="align_column" key={index}>
                                        <div id="staff_event_card_input" className="align_column">
                                            <label htmlFor={'staff_ticket_tier_name_' + index}>Tier Name</label>
                                            <input id={'staff_ticket_tier_name_' + index} type="text" placeholder="Tier Name" value={tier.name} onChange={(e) => handleTierChange(index, 'name', e.target.value)} className={errors.tiers && errors.tiers[index] && errors.tiers[index].name ? "input-error" : ""} />
                                            {errors.tiers && errors.tiers[index] && errors.tiers[index].name && <span className="field-error-text">{errors.tiers[index].name}</span>}
                                        </div>
                                        <div id="staff_info_card_input_group">
                                            <div id="staff_event_card_input" className="align_column">
                                                <label htmlFor={'staff_ticket_tier_quantity_' + index}>Quantity</label>
                                                <input id={'staff_ticket_tier_quantity_' + index} type="text" value={tier.quantity} onChange={(e) => handleTierChange(index, 'quantity', e.target.value)} className={errors.tiers && errors.tiers[index] && errors.tiers[index].quantity ? "input-error" : ""} />
                                                {errors.tiers && errors.tiers[index] && errors.tiers[index].quantity && <span className="field-error-text">{errors.tiers[index].quantity}</span>}
                                            </div>
                                            <div id="staff_event_card_input" className="align_column">
                                                <label htmlFor={'staff_ticket_tier_price_' + index}>Price</label>
                                                <input id={'staff_ticket_tier_price_' + index} type="text" value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} className={errors.tiers && errors.tiers[index] && errors.tiers[index].price ? "input-error" : ""} />
                                                {errors.tiers && errors.tiers[index] && errors.tiers[index].price && <span className="field-error-text">{errors.tiers[index].price}</span>}
                                            </div>
                                        </div>
                                        <button id="staff_event_ticket_tier_delete_button" onClick={() => {
                                            const newTiers = [...ticketTiers];
                                            newTiers.splice(index, 1);
                                            setTicketTiers(newTiers);
                                        }}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div id="staff_main_column_part" className="align_column edit-event-main-column-right">
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Event Poster</span>
                            </div>
                            <div id="staff_choosen_event_poster">
                                {posterPreview ? (
                                    <img
                                        src={posterPreview}
                                        alt="Poster preview"
                                        className="edit-event-poster-img"
                                    />
                                ) : hasPoster ? (
                                    <img
                                        src={`/api/events/${id}/poster`}
                                        alt="Event poster"
                                        className="edit-event-poster-img"
                                        onError={() => setHasPoster(false)}
                                    />
                                ) : (
                                    'Upload Event Poster'
                                )}
                            </div>
                            <label id="staff_event_poster_button" htmlFor="staff_event_poster_file">
                                {hasPoster || posterFile ? 'Change Poster' : 'Choose File'}
                            </label>
                            <input
                                type="file"
                                id="staff_event_poster_file"
                                accept="image/jpeg,image/png,image/webp"
                                className="edit-event-poster-file-input"
                                onChange={handlePosterChange}
                            />
                            {errors.poster && <span className="field-error-text">{errors.poster}</span>}
                        </div>
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Event Type</span>
                            </div>
                            <hr/>
                            <div id="staff_event_info_list" className="align_row edit-event-type-tags-container">
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
                            {errors.eventType && <span className="field-error-text" style={{width: '100%'}}>{errors.eventType}</span>}
                        </div>
                        <div id="staff_info_card" className="align_column">
                            <div id="staff_info_card_name">
                                <span>Tags</span>
                            </div>
                            <hr/>
                            <div id="staff_event_info_list" className="align_row edit-event-type-tags-container">
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
                            {errors.tags && <span className="field-error-text" style={{width: '100%'}}>{errors.tags}</span>}
                        </div>
                        <button id="staff_event_controls" className="staff_event_delete edit-event-delete-button" data-testid="staff_event_delete" onClick={() => setShowDeleteModal(true)}>Delete</button>
                        <button id="staff_event_controls" onClick={() => navigate('/')}>Cancel</button>
                        <button id="staff_event_controls" onClick={handleSubmit} disabled={isSubmitting} className={showSaveError ? 'button-error-anim' : ''}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EditEvent;
