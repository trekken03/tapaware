const validateFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];

        for (const field of requiredFields) {
            const value = req.body[field];

            if (
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '')
            ) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Please fill in all required fields',
                fields: missingFields
            });
        }

        next();
    };
};

module.exports = validateFields;
