// The barangay's puroks (shown as "Zone" in most screens). Keep in sync with
// src/constants/puroks.js on the frontend.
const PUROK_COUNT = 7;
const PUROKS = Array.from({ length: PUROK_COUNT }, (_, index) => index + 1);

// Accepts 1..PUROK_COUNT as a number or a numeric string; rejects everything else.
const isValidPurok = (value) => {
    let number;
    if (typeof value === 'number') {
        number = value;
    } else if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
        number = Number(value.trim());
    } else {
        return false;
    }
    return Number.isInteger(number) && number >= 1 && number <= PUROK_COUNT;
};

// One empty row for every purok that has no row in `rows` (matched on row.zone).
// zone is a string, like the VARCHAR column the real rows come from.
const missingPurokRows = (rows, makeEmptyRow) => {
    const present = new Set(rows.map((row) => String(row.zone).trim()));
    return PUROKS
        .filter((purok) => !present.has(String(purok)))
        .map((purok) => makeEmptyRow(String(purok)));
};

module.exports = { PUROK_COUNT, PUROKS, isValidPurok, missingPurokRows };
