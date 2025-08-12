require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Add all allowed origins (including your production domain)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chain-choice-backend-1.onrender.com',
  'https://chain-choice-voting-plum.vercel.app',
  'https://www.chainchoice.com' // <-- Add your custom domain here if you have one
];

// ✅ CORS middleware with preflight support
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Handle preflight requests for all routes
app.options('*', cors());

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