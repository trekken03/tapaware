// Resident confirmation of a resolved report. There is no scheduler: the state is
// derived every time a report is read. This is the only place the window is set;
// the frontend shows the state and deadline the API sends.
const CONFIRMATION_WINDOW_HOURS = 72;

// The columns come from docs/sql/alpha-feedback-d.sql; `reports.*` only has them once it ran.
const hasConfirmationColumns = (row) => Boolean(row) && Object.prototype.hasOwnProperty.call(row, 'reopen_count');

const toDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

// { state, deadline, responded_at, reopened_at, comment } or null.
//   awaiting       resolved, no response for this resolution, inside the window
//   confirmed      resolved and the resident confirmed this resolution
//   auto_confirmed resolved, no response, window passed
//   reopened       the resident answered "not resolved" and it is open again
// A response only counts for the resolution it answered (responded at or after
// resolved_at), so a report reopened and resolved again asks the resident again.
const deriveConfirmation = (row, now = new Date()) => {
    if (!hasConfirmationColumns(row)) return null;

    const resolvedAt = toDate(row.resolved_at);
    const respondedAt = toDate(row.resident_responded_at);
    const comment = row.resident_comment || null;

    if (row.status === 'resolved') {
        if (!resolvedAt) return null; // resolved before resolution details existed
        const deadline = new Date(resolvedAt.getTime() + CONFIRMATION_WINDOW_HOURS * 60 * 60 * 1000);
        const answeredThisResolution = respondedAt && respondedAt.getTime() >= resolvedAt.getTime();

        if (answeredThisResolution && row.resident_response === 'confirmed') {
            return { state: 'confirmed', deadline, responded_at: respondedAt, reopened_at: null, comment };
        }
        return {
            state: now.getTime() <= deadline.getTime() ? 'awaiting' : 'auto_confirmed',
            deadline,
            responded_at: null,
            reopened_at: null,
            comment: null,
        };
    }

    const reopenedAt = toDate(row.reopened_at);
    if (row.resident_response === 'not_resolved' && reopenedAt) {
        return { state: 'reopened', deadline: null, responded_at: respondedAt, reopened_at: reopenedAt, comment };
    }
    return null;
};

module.exports = { CONFIRMATION_WINDOW_HOURS, hasConfirmationColumns, deriveConfirmation };
