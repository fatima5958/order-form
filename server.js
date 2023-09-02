const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Client, Environment } = require('square');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();

app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const squareClient = new Client({
  environment: Environment.Sandbox, // Change to Environment.Production for live environment
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

app.post('/submit-order', async (req, res) => {
  try {
    const { category, name, email, contact, description, nonce } = req.body;

    if (!category || !name || !email || !contact || !description || !nonce) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const paymentRequest = {
      source_id: nonce,
      amount_money: {
        amount: 500, // Replace with the actual order amount in cents (e.g., $5.00)
        currency: 'USD',
      },
      idempotency_key: Math.random().toString(36).substring(7),
    };

    const paymentResponse = await squareClient.paymentsApi.createPayment(paymentRequest);

    if (paymentResponse.result.status === 'COMPLETED') {
      const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: email,
        subject: 'Order Confirmation',
        text: `Thank you for your order!\nCategory: ${category}\nName: ${name}\nEmail: ${email}\nContact: ${contact}\nDescription: ${description}`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: 'Thank you! Your order has been submitted successfully.',
        category,
        name,
        email,
        contact,
        description,
        amount: paymentRequest.amount_money.amount, // Include the actual order amount
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed. Please try again later.',
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
