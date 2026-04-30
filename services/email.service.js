'use strict';
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_SECURE === 'true', // true → 465, false → STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Gửi email xác thực tài khoản.
 * @param {string} to       - Địa chỉ email người nhận
 * @param {string} username - Tên đăng nhập
 * @param {string} token    - Token xác thực
 */
async function sendVerificationEmail(to, username, token) {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const link = `${baseUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"E-Learning Platform" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Xác thực địa chỉ email của bạn',
    html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực Email</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;margin-bottom:16px;">
                <span style="font-size:28px;">📚</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">E-Learning Platform</h1>
              <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">Xác thực địa chỉ email của bạn</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 12px;font-size:16px;color:#374151;">Xin chào <strong style="color:#4f46e5;">${username}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Cảm ơn bạn đã đăng ký tài khoản trên <strong>E-Learning Platform</strong>. 
                Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${link}"
                   style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
                  ✅ Xác thực Email
                </a>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-align:center;">
                Liên kết có hiệu lực trong <strong>24 giờ</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0;">
            </td>
          </tr>
          <!-- Link fallback -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Hoặc sao chép và dán liên kết sau vào trình duyệt:</p>
              <p style="margin:0;font-size:12px;color:#4f46e5;word-break:break-all;">${link}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 E-Learning Platform. Tất cả quyền được bảo lưu.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

module.exports = { sendVerificationEmail };
