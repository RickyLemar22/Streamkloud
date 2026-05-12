import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/mysql.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/sendEmail.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name || '',
      userType: 'user',
      is_verified: Number(user.is_verified || 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const generateSixDigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const buildUserResponse = (user) => {
  return {
    id: user.id,
    name: user.name,
    displayName: user.name,
    email: user.email,
    role: 'user',
    userType: 'user',
    photoURL: '',
    subscription: null,
    is_verified: Number(user.is_verified || 0),
  };
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required.');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [existingUsers] = await pool.query(
    `SELECT id, name, email, password, is_verified, auth_provider
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0];

    if (Number(existingUser.is_verified) === 1) {
      res.status(400);
      throw new Error('Email already exists.');
    }

    const verificationCode = generateSixDigitCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
       SET name = ?,
           password = ?,
           verification_code = ?,
           verification_code_expires = ?,
           reset_code = NULL,
           reset_code_expires = NULL,
           is_verified = 0,
           auth_provider = 'local'
       WHERE id = ?`,
      [
        name.trim(),
        hashedPassword,
        verificationCode,
        verificationExpires,
        existingUser.id,
      ]
    );

    await sendVerificationEmail({
      email: normalizedEmail,
      name: name.trim(),
      code: verificationCode,
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent. Please verify your email.',
      email: normalizedEmail,
    });
  }

  const verificationCode = generateSixDigitCode();
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `INSERT INTO users
     (name, email, password, verification_code, verification_code_expires, is_verified, auth_provider)
     VALUES (?, ?, ?, ?, ?, 0, 'local')`,
    [
      name.trim(),
      normalizedEmail,
      hashedPassword,
      verificationCode,
      verificationExpires,
    ]
  );

  await sendVerificationEmail({
    email: normalizedEmail,
    name: name.trim(),
    code: verificationCode,
  });

  return res.status(201).json({
    success: true,
    message: 'Registration successful. Verification code sent.',
    id: result.insertId,
    email: normalizedEmail,
  });
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [users] = await pool.query(
    `SELECT id, name, email, password, is_verified, auth_provider
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (users.length === 0) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  const user = users[0];

  if (user.auth_provider === 'google' && !user.password) {
    res.status(400);
    throw new Error(
      'This account uses Google sign-in. Please continue with Google.'
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password || '');

  if (!isPasswordValid) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  if (Number(user.is_verified) !== 1 && user.auth_provider !== 'google') {
    res.status(403);
    throw new Error('Please verify your email before logging in.');
  }

  return res.json({
    success: true,
    token: generateToken(user),
    user: buildUserResponse(user),
    userType: 'user',
  });
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [users] = await pool.query(
    `SELECT id, name, email, is_verified, auth_provider
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (users.length === 0) {
    res.status(404);
    throw new Error('User not found.');
  }

  const user = users[0];

  if (Number(user.is_verified) === 1) {
    res.status(400);
    throw new Error('Email is already verified.');
  }

  const verificationCode = generateSixDigitCode();
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query(
    `UPDATE users
     SET verification_code = ?,
         verification_code_expires = ?
     WHERE id = ?`,
    [verificationCode, verificationExpires, user.id]
  );

  await sendVerificationEmail({
    email: normalizedEmail,
    name: user.name,
    code: verificationCode,
  });

  return res.json({
    success: true,
    message: 'Verification code sent.',
  });
};

export const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error('Email and verification code are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [users] = await pool.query(
    `SELECT id, name, email, verification_code, verification_code_expires, is_verified, auth_provider
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (users.length === 0) {
    res.status(404);
    throw new Error('User not found.');
  }

  const user = users[0];

  if (!user.verification_code || !user.verification_code_expires) {
    res.status(400);
    throw new Error('No verification code found. Please request a new code.');
  }

  const codeMatches =
    String(user.verification_code).trim() === String(code).trim();

  const codeExpired =
    new Date(user.verification_code_expires).getTime() < Date.now();

  if (!codeMatches || codeExpired) {
    res.status(400);
    throw new Error('Invalid or expired verification code.');
  }

  await pool.query(
    `UPDATE users
     SET is_verified = 1,
         verification_code = NULL,
         verification_code_expires = NULL
     WHERE id = ?`,
    [user.id]
  );

  const verifiedUser = {
    ...user,
    is_verified: 1,
  };

  return res.json({
    success: true,
    message: 'Email verified successfully.',
    token: generateToken(verifiedUser),
    user: buildUserResponse(verifiedUser),
    userType: 'user',
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [users] = await pool.query(
    `SELECT id, name, email, password, auth_provider
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (users.length === 0) {
    res.status(404);
    throw new Error('User not found.');
  }

  const user = users[0];

  if (user.auth_provider === 'google' && !user.password) {
    res.status(400);
    throw new Error(
      'This account uses Google sign-in. Password reset is not available.'
    );
  }

  const resetCode = generateSixDigitCode();
  const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query(
    `UPDATE users
     SET reset_code = ?,
         reset_code_expires = ?
     WHERE id = ?`,
    [resetCode, resetExpires, user.id]
  );

  await sendPasswordResetEmail({
    email: normalizedEmail,
    name: user.name,
    code: resetCode,
  });

  return res.json({
    success: true,
    message: 'Password reset code sent.',
  });
};

export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400);
    throw new Error('Email, reset code, and new password are required.');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [users] = await pool.query(
    `SELECT id, name, email, reset_code, reset_code_expires, password, auth_provider
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );

  if (users.length === 0) {
    res.status(404);
    throw new Error('User not found.');
  }

  const user = users[0];

  if (!user.reset_code || !user.reset_code_expires) {
    res.status(400);
    throw new Error('No reset code found. Please request a new code.');
  }

  const codeMatches = String(user.reset_code).trim() === String(code).trim();

  const codeExpired =
    new Date(user.reset_code_expires).getTime() < Date.now();

  if (!codeMatches || codeExpired) {
    res.status(400);
    throw new Error('Invalid or expired reset code.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.query(
    `UPDATE users
     SET password = ?,
         reset_code = NULL,
         reset_code_expires = NULL,
         verification_code = NULL,
         verification_code_expires = NULL,
         is_verified = 1,
         auth_provider = 'local'
     WHERE id = ?`,
    [hashedPassword, user.id]
  );

  return res.json({
    success: true,
    message: 'Password reset successful. You can now log in.',
  });
};