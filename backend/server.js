require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const citiesRoutes = require('./routes/cities');
const activitiesRoutes = require('./routes/activities');
const tripsRoutes = require('./routes/trips');
const itineraryRoutes = require('./routes/itinerary');
const communityRoutes = require('./routes/community');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Traveloop backend running on port ${PORT}`));
