const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send an email notification.
 * Silently fails if SMTP is not configured.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 Email skipped (SMTP not configured): ${subject} → ${to}`);
    return null;
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"Support Desk" <${process.env.EMAIL_FROM || 'noreply@supportdesk.com'}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    return null;
  }
};

/**
 * Pre-built email templates.
 */
const emailTemplates = {
  ticketCreated: (ticket) => ({
    subject: `[${ticket.ticketId}] Ticket Created: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Ticket Created</h2>
        </div>
        <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p>${ticket.description}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <p style="color: #64748b; font-size: 14px;">You will receive updates as your ticket progresses.</p>
        </div>
      </div>
    `,
  }),

  ticketUpdated: (ticket, update) => ({
    subject: `[${ticket.ticketId}] Ticket Updated: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Ticket Updated</h2>
        </div>
        <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <p><strong>Ticket:</strong> ${ticket.ticketId} — ${ticket.title}</p>
          <p><strong>Update:</strong> ${update}</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
