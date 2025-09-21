const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the static HTML file
app.use(express.static(path.join(__dirname)));

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'saplpedemo@gmail.com',
        pass: 'keabosyzpcfsweiz'
    }
});

// Handle POST request to send an email
app.post('/send-email', (req, res) => {
    const { name, email, subject, message } = req.body;

    // Email body with a beautiful header and customized content
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="width: 100%; text-align: center; background-color: #f0f0f0;">
                <img src="https://placehold.co/600x200/5E548E/fff?text=Vertigo+Travels" alt="Vertigo Travels Header" style="width: 100%; height: auto; display: block; border-bottom: 3px solid #E0B19A;">
            </div>
            <div style="padding: 20px;">
                <h2 style="color: #5E548E; margin-bottom: 20px; text-align: center;">Welcome to the Vertigo Travels Family!</h2>
                <p>Hello ${name},</p>
                <p>Thank you for subscribing to our course! We're thrilled to have you on board as you begin your journey with Vertigo Travels. We are committed to helping you discover the world's most breathtaking destinations.</p>
                <p>We've received your request and have already begun processing it. We'll be in touch with you shortly with more details.</p>
                
                <p>Dear Admin,</p>
                <p>Please find the pending document for your approval <a href="${message}" style="color: #E0B19A; text-decoration: none; font-weight: bold;">here</a>.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                &copy; 2025 Vertigo Travels. All rights reserved.
            </div>
        </div>
    `;

    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: `${email}`,
        subject: `New Contact Form Submission: ${subject}`,
        html: emailHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Something went wrong. Please try again later.');
        } else {
            console.log('Email sent:', info.response);
            res.status(200).send('Email sent successfully!');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
