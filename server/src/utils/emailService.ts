import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetPasswordEmail = async (to: string, name: string, token: string) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"G1Club" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Réinitialisation de votre mot de passe — G1Club',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#1e3a5f,#1e2d45);padding:32px;text-align:center;">
                  <div style="display:inline-block;background:#1e2d45;border-radius:12px;padding:12px;">
                    <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">G1Club</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 40px 32px;">
                  <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">Bonjour ${name} 👋</h1>
                  <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
                    Vous avez demandé la réinitialisation de votre mot de passe.<br>
                    Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                  </p>
                  <div style="text-align:center;margin:0 0 28px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                      🔑 Réinitialiser mon mot de passe
                    </a>
                  </div>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;margin:0;">
                    Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.<br><br>
                    Lien alternatif : <a href="${resetUrl}" style="color:#60a5fa;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid rgba(255,255,255,0.08);padding:20px 40px;text-align:center;">
                  <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} G1Club — Plateforme de gestion sportive</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

export const sendVerificationEmail = async (to: string, name: string, token: string) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"G1Club" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Confirmez votre adresse email — G1Club',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0a0f1e;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1e3a5f,#1e2d45);padding:32px;text-align:center;">
                  <div style="display:inline-block;background:#1e2d45;border-radius:12px;padding:12px;">
                    <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">G1Club</span>
                  </div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">Bonjour ${name} 👋</h1>
                  <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
                    Merci de vous être inscrit sur <strong style="color:#fff;">G1Club</strong>.<br>
                    Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
                  </p>
                  <div style="text-align:center;margin:0 0 28px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;">
                      ✅ Confirmer mon email
                    </a>
                  </div>
                  <p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;margin:0;">
                    Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas créé de compte sur G1Club, ignorez cet email.<br><br>
                    Lien alternatif : <a href="${verifyUrl}" style="color:#60a5fa;">${verifyUrl}</a>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="border-top:1px solid rgba(255,255,255,0.08);padding:20px 40px;text-align:center;">
                  <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} G1Club — Plateforme de gestion sportive</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};
