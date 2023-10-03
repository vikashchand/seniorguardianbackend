const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv').config();
const dbConfig=require('./config/dbConfig')
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
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newActivity = new Activity(req.body);
      await newActivity.save();
      res.status(201).json(newActivity);
    } catch (error) {
      console.error('Error adding activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE Route for Deleting an Activity
app.delete('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const deletedActivity = await Activity.findByIdAndRemove(id);
    if (!deletedActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.status(200).json(deletedActivity);
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define a route to fetch activities based on their type
app.get('/api/activities', async (req, res) => {
  try {
    // Retrieve the activity type from the query parameter
    const { type } = req.query;

    // Define a query object to filter activities by type
    const query = type ? { type } : {};

    // Use Mongoose to fetch activities based on the type query
    const activities = await Activity.find(query);

    // Send the filtered activities as a JSON response
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Define your routes and other middleware here as needed


const PORT =process.env.PORT

app.listen(PORT,console.log(`server is listening on ${PORT}`))