const fs = require('fs');

function processFile(path, isEdit) {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Replace state
    content = content.replace("const [errorMsg, setErrorMsg] = useState('');", "const [errors, setErrors] = useState({});");

    // 2. Replace handleSubmit validation
    let validationStr = `        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Required';
        if (!date) newErrors.date = 'Required';
        if (!time) newErrors.time = 'Required';
        if (!location.trim()) newErrors.location = 'Required';
        if (!description.trim()) newErrors.description = 'Required';
        if (!eventType) newErrors.eventType = 'Required';
        if (tags.length === 0) newErrors.tags = 'Required';
        if (${isEdit ? '!hasPoster && !posterFile' : '!posterFile'}) newErrors.poster = 'Required';

        if (ticketTiers.length === 0) {
            newErrors.tickets = 'At least one ticket tier is required.';
        } else {
            ticketTiers.forEach((tier, index) => {
                if (!tier.name.trim()) newErrors[\`tier_\${index}_name\`] = 'Required';
                if (tier.quantity === '') newErrors[\`tier_\${index}_quantity\`] = 'Required';
                if (tier.price === '') newErrors[\`tier_\${index}_price\`] = 'Required';
            });
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }`;

    const oldValidationStart = `        setErrorMsg('');`;
    const oldValidationEnd = `        setIsSubmitting(true);`;
    
    const startIdx = content.indexOf(oldValidationStart);
    const endIdx = content.indexOf(oldValidationEnd);

    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx) + validationStr + "\n\n" + content.substring(endIdx);
    }

    // 3. Add spans for simple inputs
    content = content.replace(/(<input id="staff_event_name"[^>]+>)/, "$1\n                                {errors.title && <span className=\"field-error-text\">{errors.title}</span>}");
    content = content.replace(/(<input id="staff_event_date"[^>]+>)/, "$1\n                                    {errors.date && <span className=\"field-error-text\">{errors.date}</span>}");
    content = content.replace(/(<input id="staff_event_time"[^>]+>)/, "$1\n                                    {errors.time && <span className=\"field-error-text\">{errors.time}</span>}");
    content = content.replace(/(<input id="staff_event_location"[^>]+>)/, "$1\n                                {errors.location && <span className=\"field-error-text\">{errors.location}</span>}");
    content = content.replace(/(<textarea id="staff_event_description"[^>]+><\/textarea>|<textarea id="staff_event_description"[^>]+ \/>)/, "$1\n                                {errors.description && <span className=\"field-error-text\">{errors.description}</span>}");
    
    // 4. Ticket Tiers
    content = content.replace(/(<span>Ticket Tiers<\/span>\s*<button[^>]+>\+ Add Tier<\/button>)/, "$1\n                                {errors.tickets && <span className=\"field-error-text\" style={{margin: '0.5rem auto'}}>{errors.tickets}</span>}");
    
    if(isEdit) {
        content = content.replace(/(<input id={'staff_ticket_tier_name_' \+ index}[^>]+>)/, "$1\n                                            {errors[`tier_${index}_name`] && <span className=\"field-error-text\">{errors[`tier_${index}_name`]}</span>}");
        content = content.replace(/(<input id={'staff_ticket_tier_quantity_' \+ index}[^>]+>)/, "$1\n                                                {errors[`tier_${index}_quantity`] && <span className=\"field-error-text\">{errors[`tier_${index}_quantity`]}</span>}");
        content = content.replace(/(<input id={'staff_ticket_tier_price_' \+ index}[^>]+>)/, "$1\n                                                {errors[`tier_${index}_price`] && <span className=\"field-error-text\">{errors[`tier_${index}_price`]}</span>}");
    } else {
        content = content.replace(/(<input id={`tier_name_\${index}`}[^>]+>)/, "$1\n                                            {errors[`tier_${index}_name`] && <span className=\"field-error-text\">{errors[`tier_${index}_name`]}</span>}");
        content = content.replace(/(<input id={`tier_qty_\${index}`}[^>]+>)/, "$1\n                                                {errors[`tier_${index}_quantity`] && <span className=\"field-error-text\">{errors[`tier_${index}_quantity`]}</span>}");
        content = content.replace(/(<input id={`tier_price_\${index}`}[^>]+>)/, "$1\n                                                {errors[`tier_${index}_price`] && <span className=\"field-error-text\">{errors[`tier_${index}_price`]}</span>}");
    }
    
    // 5. Poster
    const posterTarget = isEdit ? 'className="edit-event-poster-file-input"\n                                onChange={handlePosterChange}\n                            />' : 'accept="image/jpeg,image/png,image/webp"\n                                onChange={handlePosterChange}\n                            />';
    content = content.replace(posterTarget, posterTarget + "\n                            {errors.poster && <span className=\"field-error-text\">{errors.poster}</span>}");

    // 6. Tags & Type
    const typeTarget = isEdit ? '<div id="staff_event_info_list" className="align_row edit-event-type-tags-container">' : '<div id="staff_event_info_list" className="align_row ce-type-tags">';
    
    // Add eventType error below the first matching tag container, and tags error below the second
    let idx = 0;
    content = content.replace(new RegExp(typeTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
        idx++;
        if (idx === 1) return match + "\n                                {errors.eventType && <span className=\"field-error-text\" style={{width: '100%'}}>{errors.eventType}</span>}";
        if (idx === 2) return match + "\n                                {errors.tags && <span className=\"field-error-text\" style={{width: '100%'}}>{errors.tags}</span>}";
        return match;
    });

    // 7. Remove the old errorMsg box
    const oldErrorBox = `{errorMsg && (
                            <div className="form-error-message">
                                <span>⚠️ {errorMsg}</span>
                            </div>
                        )}`;
    content = content.replace(oldErrorBox, "");

    fs.writeFileSync(path, content, 'utf8');
}

processFile('/Users/eimantaslabzentis/Desktop/PSK_Named/PSK_NAMED/frontend/src/CreateEvent.jsx', false);
processFile('/Users/eimantaslabzentis/Desktop/PSK_Named/PSK_NAMED/frontend/src/EditEvent.jsx', true);

// Add CSS for field-error-text
let css = fs.readFileSync('/Users/eimantaslabzentis/Desktop/PSK_Named/PSK_NAMED/frontend/src/main.css', 'utf8');
if (!css.includes('.field-error-text')) {
    css += `\n.field-error-text {
    color: var(--primary-attention-color, #ff4d4f);
    font-size: 0.85rem;
    font-weight: bold;
    margin: 0.2rem 0 0 0.5rem;
    display: block;
    animation: fadeIn 0.25s ease-out;
}\n`;
    fs.writeFileSync('/Users/eimantaslabzentis/Desktop/PSK_Named/PSK_NAMED/frontend/src/main.css', css, 'utf8');
}

console.log("Done");
