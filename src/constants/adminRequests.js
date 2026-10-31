// Request types for "Contact an admin". Keep in sync with
// backend/controllers/adminRequest.controller.js.
export const ADMIN_REQUEST_TYPES = [
    { value: 'change_email', label: 'Change email' },
    { value: 'change_household', label: 'Change household or zone' },
    { value: 'correct_name', label: 'Correct name' },
    { value: 'other', label: 'Other' },
]

export const adminRequestTypeLabel = (value) =>
    ADMIN_REQUEST_TYPES.find(t => t.value === value)?.label || value
