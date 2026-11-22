
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending'
    },

    orderStatus: {
      type: String,
      enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Placed'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
