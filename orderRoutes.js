
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// VERIFY USER LOGIN
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Please login first.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
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

// PLACE A NEW ORDER
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your order must contain at least one product.'
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      if (
        !productId ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product or quantity.'
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'A product in your cart was not found.'
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}.`
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      });

      totalAmount += product.price * quantity;
    }

    const newOrder = new Order({
      user: req.userId,
      items: orderItems,
      totalAmount
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to place order.'
    });
  }
});

// CANCEL AN ORDER
router.patch('/:orderId/cancel', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (!['Placed', 'Processing'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'This order can no longer be cancelled.'
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This order is already paid. A refund must be handled separately.'
      });
    }

    order.orderStatus = 'Cancelled';

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Your order has been cancelled successfully!',
      order
    });

  } catch (error) {
    console.error('Order cancellation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to cancel order.'
    });
  }
});

// GET LOGGED-IN USER'S ORDERS
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.userId
    }).populate('items.product', 'name price image');

    res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Fetch orders error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch orders.'
    });
  }
});

module.exports = router;
