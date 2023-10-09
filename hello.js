const { sendNotifications } = require('./index');

// Call the sendNotifications function
sendNotifications()
  .then(() => {
    console.log('sendNotifications function executed successfully.');
  })
  .catch((error) => {
    console.error('Error executing sendNotifications function:', error);
  });