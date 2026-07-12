const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const householdRoutes = require('./routes/household.routes');
const tdsRoutes = require('./routes/tds.routes');
const reportRoutes = require('./routes/report.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adminRoutes = require('./routes/admin.routes');
const concernRoutes = require('./routes/concern.routes');


const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());



app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});


app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/tds', tdsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/concerns', concernRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'TapAware API is running!' });
});

module.exports = app;