import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },

  tls: {
    rejectUnauthorized: false,
  },
});

const fromAddress = `"${process.env.FROM_NAME || 'StreamKloud'}" <${
  process.env.FROM_EMAIL || process.env.SMTP_USER
}>`;

const codeBox = (code) => `
  <div style="
    font-size: 32px;
    font-weight: bold;
    letter-spacing: 8px;
    color: #111827;
    background: #f3f4f6;
    padding: 18px 24px;
    border-radius: 10px;
    display: inline-block;
    margin: 20px 0;
  ">
    ${code}
  </div>
`;

const baseTemplate = ({ title, name, message, code }) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px;">
    <h2 style="color: #f97316;">${title}</h2>

    <p>Hello ${name || 'there'},</p>

    <p>${message}</p>

    ${codeBox(code)}

    <p>This code expires in 10 minutes.</p>

    <p>If you did not request this, you can safely ignore this email.</p>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

    <p style="font-size: 12px; color: #6b7280;">
      StreamKloud Security Notification
    </p>
  </div>
`;

export const sendVerificationEmail = async ({ email, name, code }) => {
  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Your StreamKloud verification code',
    html: baseTemplate({
      title: 'Verify your StreamKloud account',
      name,
      message: 'Use the 6-digit code below to verify your email address.',
      code,
    }),
  });
};

export const sendPasswordResetEmail = async ({ email, name, code }) => {
  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Your StreamKloud password reset code',
    html: baseTemplate({
      title: 'Reset your StreamKloud password',
      name,
      message: 'Use the 6-digit code below to reset your password.',
      code,
    }),
  });
};