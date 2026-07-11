require('dotenv').config();
const sendEmail = require('./utils/emailSender');

const runTest = async () => {
    const result = await sendEmail({
        to: 'johnpatrickgalanido@gmail.com', // replace with the exact email you signed up to Resend with
        subject: 'TapAware Test Email',
        html: '<h1>Hello from TapAware!</h1><p>If you see this, Resend is working correctly.</p>'
    });

    console.log('Result:', result);
};

runTest();