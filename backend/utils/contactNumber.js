const normalizeContactNumber = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const compactNumber = value.trim().replace(/[\s\-()]/g, '');
    const normalizedNumber = compactNumber.replace(/^\+?63/, '0');

    return /^09\d{9}$/.test(normalizedNumber) ? normalizedNumber : null;
};

module.exports = normalizeContactNumber;
