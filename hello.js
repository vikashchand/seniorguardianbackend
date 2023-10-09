const nodemailer = require('nodemailer'); // Import nodemailer
const moment = require('moment');
const cron = require('node-cron'); // Import node-cron
const SMTP_MAIL = process.env.SMTP_MAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

const Activity = require('./models/Activity');

async function sendNotifications() {
    console.log('Sending notifications for tasks scheduled within the next hour');
    try {
      // Calculate the current time and the time 1 hour from now
      const currentTime = moment();
      const oneHourFromNow = moment().add(1, 'hour');
  
      console.log('Current time:', currentTime.format('YYYY-MM-DD HH:mm'));
      console.log('One hour from now:', oneHourFromNow.format('YYYY-MM-DD HH:mm'));
  
      // Find tasks that are scheduled within the next hour
      const tasks = await Activity.find({
        // Convert time strings to moment objects for comparison
        time: {
          $gte: currentTime.format('HH:mm'), // Convert current time to "HH:mm"
          $lt: oneHourFromNow.format('HH:mm'), // Convert one hour from now to "HH:mm"
        },
      });
  
      console.log('Found tasks:', tasks);
  
      // Check if there are tasks found
      if (tasks.length > 0) {
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
  
        // Prepare the email content with the list of upcoming tasks
        let emailContent = 'Upcoming Tasks:\n\n';
  
        // Iterate through the fetched tasks and add their names to the email content
        for (const task of tasks) {
          emailContent += `- Task "${task.name}" scheduled at ${moment(task.time, 'HH:mm').format('LT')}\n`;
        }
  
        console.log('Email content:', emailContent); // Log the email content
  
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
      } else {
        console.log('No upcoming tasks found. Email not sent.');
      }
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
  