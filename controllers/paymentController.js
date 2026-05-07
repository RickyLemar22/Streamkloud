import crypto from 'crypto';
import mysqlPool from '../config/mysql.js';

const PLANS = {
  lite: { name: 'Lite', amount: 1000, currency: 'UGX', durationDays: 1 },
  standard: { name: 'Standard', amount: 4000, currency: 'UGX', durationDays: 30 },
  family: { name: 'Family / Group', amount: 10000, currency: 'UGX', durationDays: 30 },
  quarterly: { name: 'Quarterly', amount: 52000, currency: 'UGX', durationDays: 90 },
  annual: { name: 'Annual', amount: 105000, currency: 'UGX', durationDays: 365 },
};

const generateTxRef = (userId, plan) =>
  `SK_TEST_${plan}_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const getPlanId = async (plan) => {
  const selectedPlan = PLANS[plan];

  const [rows] = await mysqlPool.query(
    `
    SELECT id
    FROM subscription_plans
    WHERE LOWER(name) = LOWER(?)
       OR LOWER(name) = LOWER(?)
    LIMIT 1
    `,
    [plan, selectedPlan.name]
  );

  if (rows.length === 0) {
    throw new Error(`Subscription plan '${plan}' was not found in subscription_plans table`);
  }

  return rows[0].id;
};

const activateSubscription = async ({
  userId,
  plan,
  transactionId,
  txRef,
  amount,
  currency,
}) => {
  const selectedPlan = PLANS[plan];

  if (!selectedPlan) {
    throw new Error('Invalid subscription plan');
  }

  const planId = await getPlanId(plan);
  const startDate = new Date();
  const endDate = addDays(selectedPlan.durationDays);

  await mysqlPool.query(
    `
    INSERT INTO payments
      (user_id, plan, amount, currency, transaction_id, tx_ref, status, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, 'successful', NOW())
    ON DUPLICATE KEY UPDATE
      status = 'successful',
      transaction_id = VALUES(transaction_id)
    `,
    [userId, plan, amount, currency, transactionId, txRef]
  );

  const [existing] = await mysqlPool.query(
    `
    SELECT id
    FROM user_subscriptions
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (existing.length > 0) {
    await mysqlPool.query(
      `
      UPDATE user_subscriptions
      SET 
        plan_id = ?,
        start_date = ?,
        end_date = ?,
        status = 'active'
      WHERE user_id = ?
      `,
      [planId, startDate, endDate, userId]
    );
  } else {
    await mysqlPool.query(
      `
      INSERT INTO user_subscriptions
        (user_id, plan_id, start_date, end_date, status)
      VALUES
        (?, ?, ?, ?, 'active')
      `,
      [userId, planId, startDate, endDate]
    );
  }

  return {
    plan,
    planId,
    status: 'active',
    startsAt: startDate,
    expiresAt: endDate,
  };
};

export const createCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({
        message: 'Invalid subscription plan',
        allowedPlans: Object.keys(PLANS),
      });
    }

    const selectedPlan = PLANS[plan];
    const txRef = generateTxRef(user.id, plan);
    const transactionId = `TEST_TX_${Date.now()}`;

    const subscription = await activateSubscription({
      userId: user.id,
      plan,
      transactionId,
      txRef,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
    });

    return res.status(200).json({
      success: true,
      testMode: true,
      message: `${selectedPlan.name} subscription activated successfully in test mode`,
      plan,
      txRef,
      transactionId,
      subscription,
    });
  } catch (error) {
    console.error('Create checkout test-mode error:', error.message);

    return res.status(500).json({
      message: error.message || 'Failed to activate test subscription',
    });
  }
};

export const flutterwaveWebhook = async (req, res) => {
  return res.status(200).json({
    success: true,
    testMode: true,
    message: 'Webhook ignored in local test-payment mode',
  });
};

export const verifyPayment = async (req, res) => {
  return res.status(200).json({
    success: true,
    testMode: true,
    message: 'Payment verification skipped in local test-payment mode',
  });
};

export const getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await mysqlPool.query(
      `
      SELECT
        id,
        plan,
        amount,
        currency,
        transaction_id,
        tx_ref,
        status,
        created_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.json(payments);
  } catch (error) {
    console.error('Payment history error:', error.message);

    return res.status(500).json({
      message: 'Failed to fetch payment history',
    });
  }
};