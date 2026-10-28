const validateFields = (requiredFields) => {
    return (req, res, next) => {
        // requiredFields can be a plain array (as before),
        // or a function that receives req and returns an array
        const fields = typeof requiredFields === 'function'
            ? requiredFields(req)
            : requiredFields;

        const missingFields = [];

        for (const field of fields) {
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