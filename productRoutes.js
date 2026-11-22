const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    let products = await Product.find();

    // Add sample products if the collection is empty
    if (products.length === 0) {
      const sampleProducts = [
        {
          name: 'Running Shoes',
          price: 1499,
          category: 'Fashion',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
          description: 'Comfortable everyday running shoes.',
          stock: 10
        },
        {
          name: 'Headphones',
          price: 999,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          description: 'High-quality wireless headphones.',
          stock: 10
        },
        {
          name: 'Smart Watch',
          price: 1999,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
          description: 'Smart watch for everyday use.',
          stock: 10
        },
        {
          name: 'Backpack',
          price: 799,
          category: 'Accessories',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
          description: 'Stylish backpack for daily use.',
          stock: 10
        }
      ];

      await Product.insertMany(sampleProducts);
      products = await Product.find();
    }

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch products.'
    });
  }
});

module.exports = router;