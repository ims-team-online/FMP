const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fmp_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Cloud Database'))
  .catch((err) => console.error('❌ Database connection error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const emailSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Email = mongoose.model('Email', emailSchema);

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists.' });
    const user = new User({ fullName, email, password });
    await user.save();
    res.status(201).json({ message: 'Account created successfully!', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    res.json({ message: 'Login successful!', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.post('/api/emails/send', async (req, res) => {
  try {
    const { sender, recipient, subject, body } = req.body;
    const newEmail = new Email({ sender, recipient, subject, body });
    await newEmail.save();
    res.status(201).json({ message: 'Email sent successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

app.get('/api/emails/inbox/:userEmail', async (req, res) => {
  try {
    const messages = await Email.find({ recipient: req.params.userEmail }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inbox.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
