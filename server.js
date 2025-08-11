require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');

// ✅ Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for frontend running on http://localhost:3001

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chain-choice-voting-git-main-douglas-projects-c7997ce1.vercel.app',
  'https://chain-choice-voting-plum.vercel.app' // add your production domain here
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // if you use cookies or authentication
}));

// ✅ Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// ✅ Import routes
const voterRoutes = require('./routes/voterRoutes');
const adminRoutes = require('./routes/adminRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voteRoutes = require('./routes/voteRoutes');
const resultsRoutes = require('./routes/resultsRoutes');
const path = require('path');
// ✅ Route setup
app.use('/api/voters', voterRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/results', resultsRoutes);
app.use('/logos', express.static(path.join(__dirname, 'public/logos')));
// ✅ Root route
app.get('/', (req, res) => {
  res.send('Ghana Online Voting System Backend Running');
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
