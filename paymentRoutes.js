
const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

const router = express.Router();

// Verify login
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Please login first.'
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

// Process payment for an order
router.post('/:orderId', verifyToken, async (req, res) => {
  try {
    const { method } = req.body;

    if (!['UPI', 'Card', 'Cash on Delivery'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method.'
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid.'
      });
    }

    // Simulated payment processing
    order.paymentStatus = method === 'Cash on Delivery'
      ? 'Pending'
      : 'Paid';

    await order.save();

    res.status(200).json({
      success: true,
      message: method === 'Cash on Delivery'
        ? 'Order confirmed. Payment will be collected on delivery.'
        : 'Payment successful!',
      paymentMethod: method,
      order
    });

  } catch (error) {
    console.error('Payment error:', error);

    res.status(500).json({
      success: false,
      message: 'Payment processing failed.'
    });
  }
});

module.exports = router;