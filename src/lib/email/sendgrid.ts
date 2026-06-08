import "server-only";

import sgMail from "@sendgrid/mail";

function getSendgridConfig() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required.");
  }

  return {
    apiKey,
    fromEmail,
  };
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const { apiKey, fromEmail } = getSendgridConfig();

  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to,
    from: fromEmail,
    subject: "Reset your AI Dashboard password",
    text: `Reset your password using this link: ${resetUrl}`,
    html: `
      <p>Reset your password using the link below:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 30 minutes.</p>
    `,
  });
}
