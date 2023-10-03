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

// MongoDB Configuration
const Activity = require('./models/Activity');

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000',
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
async function sendNotifications() {
  console.log('Sending notifications for tasks scheduled within the next hour');
  try {
    // Calculate the current time and the time 1 hour from now
    const currentTime = moment();
    const oneHourFromNow = moment().add(1, 'hour');

    // Find tasks that are scheduled within the next hour
    const tasks = await Activity.find({
      time: {
        $gte: currentTime.toDate(),
        $lt: oneHourFromNow.toDate(),
      },
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: SMTP_MAIL, // Replace with your Gmail username
        pass: SMTP_PASSWORD, // Replace with your Gmail password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const recipientEmail = 'recipient-email@example.com'; // Replace with recipient email

    // Prepare the email content with the list of upcoming tasks
    let emailContent = 'Upcoming Tasks:\n\n';

    tasks.forEach((task) => {
      emailContent += `- Task "${task.name}" scheduled at ${moment(task.time, 'HH:mm').format('LT')}\n`;
    });

    const mailOptions = {
      from: SMTP_MAIL, // Replace with your Gmail username
      to: "vikashchand147@gmail.com",
      subject: 'Upcoming Task Reminders',
      text: emailContent,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

// Schedule the sendNotifications function to run every minute
cron.schedule('* * * * *', sendNotifications);

// Define a global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  // You can add your own custom error handling logic here, e.g., logging or sending an alert
});

// Define your routes and other middleware here as needed

const PORT = process.env.PORT;

app.listen(PORT, console.log(`Server is listening on ${PORT}`));
