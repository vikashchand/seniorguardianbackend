const mongoose = require('mongoose');


const activitySchema = new mongoose.Schema({
  type: String,
  name: String,
  time: String,
  reminder: Boolean,
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
