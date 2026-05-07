import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  createCheckout,
  flutterwaveWebhook,
  verifyPayment,
  getPaymentHistory,
} from '../controllers/paymentController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout', protect, asyncHandler(createCheckout));
router.post('/flutterwave/webhook', asyncHandler(flutterwaveWebhook));
router.get('/verify/:transactionId', protect, asyncHandler(verifyPayment));
router.get('/history', protect, asyncHandler(getPaymentHistory));

export default router;