const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI ,{ 
  dbName: "oldcare",
  
  useNewUrlParser: true, useUnifiedTopology: true });

const dbCon = mongoose.connection;
dbCon.on("error", console.error.bind(console, "connection error: "));
dbCon.once("open", function () {
  console.log("Connected successfully");
});