const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'TapAware <onboarding@resend.dev>',
            to,
            subject,
            html,
        });

        if (error) {
            console.log('Resend error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.log('Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;