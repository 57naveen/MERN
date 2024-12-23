const orderModel = require('../models/orderModel');
const productModel = require('../models/productModel');

// Create Order - /api/v1/order 
exports.createOrder = async (req, res, next) => {
    try {
        const cartItems = req.body;

        // Calculate total order amount
        const amount = Number(
            cartItems.reduce((acc, item) => acc + item.product.price * item.qty, 0)
        ).toFixed(2);

        const status = 'pending';
        const order = await orderModel.create({ cartItems, amount, status });

        // Updating product stock
        for (const item of cartItems) {
            const productId = item.product._id.$oid || item.product._id; // Handle both cases
            const product = await productModel.findById(productId);

            if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
            }

            product.stock -= item.qty;

            if (product.stock < 0) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }

            await product.save();
        }

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
