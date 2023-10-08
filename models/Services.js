const mongoose = require('mongoose');


const servicesSchema = new mongoose.Schema({
    name: String,
    phone: String,
    description: String,
    email: String,
    dateTime: String,
    selection: String
});

const Services = mongoose.model('Services', servicesSchema);

module.exports = Services;


