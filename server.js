// server.js

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use Stripe secret key from .env
require('dotenv').config();

const express = require('express');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const pool = require('./db'); // PostgreSQL connection
const authRoutes = require('./auth'); // Authentication routes
const multer = require('multer'); // File uploads
const bodyParser = require('body-parser');

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Use auth routes
app.use('/auth', authRoutes);

// Google Cloud Storage setup
const keyFilename = path.join(__dirname, 'dream-platform.json'); // Your JSON key file
const storage = new Storage({ keyFilename });
const bucketName = 'dream-platform-videos'; // Your Google Cloud Storage bucket

// Configure Multer for file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Ensure this limit is sufficient
});


// Route for uploading videos
app.post('/upload-video', upload.single('video-file'), async (req, res) => {
  const { title, description } = req.body;

  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    const blob = storage.bucket(bucketName).file(Date.now() + '-' + req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: 'your_token_if_needed',
      },
    });

    blobStream.on('error', err => {
      console.error('Error uploading to Google Cloud:', err);
      res.status(500).json({ error: 'Unable to upload video.' });
    });

    blobStream.on('finish', async () => {
      const videoUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;

      try {
        const result = await pool.query(
          'INSERT INTO videos (title, description, video_url) VALUES ($1, $2, $3) RETURNING id',
          [title, description, videoUrl]
        );

        res.status(201).json({ videoId: result.rows[0].id, videoUrl });
      } catch (err) {
        console.error('Error saving video details:', err);
        res.status(500).json({ error: 'Error saving video details.' });
      }
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Error uploading file.' });
  }
});

// Create Stripe Checkout session for payments
app.post('/create-checkout-session', async (req, res) => {
  const { userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Premium Membership' },
          unit_amount: 1000, // $10
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: { userId },
    });

    res.json({ id: session.id });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Stripe webhook to upgrade membership on payment success
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;

      pool.query('UPDATE users SET membership = $1 WHERE id = $2', ['premium', userId])
        .then(() => res.status(200).send())
        .catch(err => res.status(500).send());
    } else {
      res.status(400).send('Unhandled event type');
    }
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
app.post('/upload-video', upload.single('video-file'), async (req, res) => {
  console.log('Video upload request received');
  const { title, description } = req.body;
  console.log('Title:', title);
  console.log('Description:', description);

  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    console.log('Uploading file:', req.file.originalname);
    const blob = storage.bucket(bucketName).file(Date.now() + '-' + req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: 'your_token_if_needed',
      },
    });

    blobStream.on('error', err => {
      console.error('Error uploading to Google Cloud:', err);
      res.status(500).json({ error: 'Unable to upload video.' });
    });

    blobStream.on('finish', async () => {
      console.log('File uploaded successfully');
      const videoUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;

      try {
        console.log('Saving video details to database');
        const result = await pool.query(
          'INSERT INTO videos (title, description, video_url) VALUES ($1, $2, $3) RETURNING id',
          [title, description, videoUrl]
        );

        res.status(201).json({ videoId: result.rows[0].id, videoUrl });
      } catch (err) {
        console.error('Error saving video details:', err);
        res.status(500).json({ error: 'Error saving video details.' });
      }
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Error uploading file.' });
  }
});
