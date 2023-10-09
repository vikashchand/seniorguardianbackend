const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv').config();
const dbConfig = require('./config/dbConfig');
const nodemailer = require('nodemailer'); // Import nodemailer
const moment = require('moment');
const cron = require('node-cron'); // Import node-cron
const SMTP_MAIL = process.env.SMTP_MAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const app = express();

const twilio = require('twilio');
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const clientno =process.env.ck;
const phoneno =process.env.pk;
const client = require('twilio')(accountSid, authToken);

// MongoDB Configuration
const Activity = require('./models/Activity');

const Services =require('./models/Services');

// CORS Configuration
const corsOptions = {
  origin: 'https://senior-guardian.vercel.app',
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// JSON Middleware (No need for bodyParser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schema for Activity (Assuming you have this in './models/Activity')

// POST Route for Adding an Activity
app.post(
  '/api/activities',
  [
    body('type').notEmpty(),
    body('name').notEmpty(),
    body('time').notEmpty(),
  ],
  async (req, res) => {
    console.log('Received POST request for adding an activity');
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newActivity = new Activity(req.body);
      await newActivity.save();
      console.log('Activity added:', newActivity);
      res.status(201).json(newActivity);
    } catch (error) {
      console.error('Error adding activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE Route for Deleting an Activity
app.delete('/api/activities/:id', async (req, res) => {
  console.log('Received DELETE request for deleting an activity');
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ID:', id);
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const deletedActivity = await Activity.findByIdAndRemove(id);
    if (!deletedActivity) {
      console.log('Activity not found for deletion:', id);
      return res.status(404).json({ error: 'Activity not found' });
    }
    console.log('Activity deleted:', deletedActivity);
    res.status(200).json(deletedActivity);
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define a route to fetch activities based on their type
app.get('/api/activities', async (req, res) => {
  console.log('Received GET request for fetching activities');
  try {
    // Retrieve the activity type from the query parameter
    const { type } = req.query;

    // Define a query object to filter activities by type
    const query = type ? { type } : {};

    // Use Mongoose to fetch activities based on the type query
    const activities = await Activity.find(query);

    console.log('Fetched activities:', activities);
    // Send the filtered activities as a JSON response
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to send notifications for tasks scheduled within the next hour
// Function to send notifications for tasks scheduled within the next hour
// Function to send notifications for tasks scheduled within the next hour

// Define your routes and other middleware here as needed



app.post('/api/submitForm', async (req, res) => {
  const currentTime = moment();
  const { name, phone, description, email, dateTime, selection } = req.body;

  const services = new Services({
    name,
    phone,
    description,
    email,
    dateTime: currentTime,
    selection,
  });

  try {
    await services.save();

    // Send a WhatsApp message
    const currentTime = moment();
    const message = await client.messages.create({
     
      body: `New form submission:\nName: ${name}\nPhone: ${phone}\nDescription: ${description}\nEmail: ${email}\nDate & Time: ${currentTime}\nServiceCategory: ${selection}`,
      from: clientno, // Replace with your Twilio phone number
      to: phoneno // Replace with the recipient's WhatsApp phone number
    });

    console.log(`WhatsApp message sent with SID: ${message.sid}`);

    res.status(200).json({ message: 'Data saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving the data or sending the WhatsApp message.' });
  }
});



const PORT = process.env.PORT;

app.listen(PORT, console.log(`Server is listening on ${PORT}`));
