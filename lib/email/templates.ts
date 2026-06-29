// lib/email/subscription-emails.ts

export function getReminderEmailHtml(companyName: string, daysLeft: number, renewUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:#1C1712;padding:10px 20px;border-radius:12px;">
        <span style="font-size:18px;font-weight:900;color:#F59E0B;">GK</span>
        <span style="font-size:14px;color:#fff;font-weight:700;">CRM</span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#fff;border:1px solid #E2D9C8;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(28,23,18,0.07);">

      <!-- Top banner -->
      <div style="background:linear-gradient(135deg,#B8860B,#D97706);padding:28px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">⏰</div>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.3;">
          ${daysLeft} day${daysLeft > 1 ? 's' : ''} left on your subscription
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">
          Renew now to avoid any interruption
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <p style="margin:0 0 8px;font-size:15px;color:#1C1712;font-weight:600;">
          Hi ${companyName} Team,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
          Your GK CRM subscription expires in <strong style="color:#B8860B;">${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>. 
          Renew now to keep your pipeline, leads, and team access running without interruption.
        </p>

        <!-- Plan box -->
        <div style="background:#FEF9EE;border:1px solid #FDE68A;border-radius:14px;padding:20px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#1C1712;">Interior Design — Professional</p>
              <p style="margin:4px 0 0;font-size:12px;color:#9A8F82;">10 users · Unlimited leads</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#1C1712;">₹10,000</p>
              <p style="margin:0;font-size:11px;color:#9A8F82;">per month</p>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">
          ${['Unlimited leads','Pipeline + HRMS','Finance module','Priority support'].map(f =>
            `<span style="font-size:12px;font-weight:600;color:#B8860B;background:#FEF9EE;border:1px solid #FDE68A;padding:5px 12px;border-radius:20px;">✓ ${f}</span>`
          ).join('')}
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;">
          <a href="${renewUrl}" 
            style="display:inline-block;background:linear-gradient(135deg,#1C1712,#2d2218);color:#fff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.01em;box-shadow:0 4px 20px rgba(28,23,18,0.2);">
            Renew Now →
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #F0EBE1;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9A8F82;">
          Need help? Contact us at 
          <a href="mailto:support@gkcrm.in" style="color:#B8860B;font-weight:600;text-decoration:none;">support@gkcrm.in</a>
        </p>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#C4BAB0;margin-top:24px;">
      GK CRM · Interior Design Pipeline · © 2026
    </p>
  </div>
</body>
</html>
  `
}

export function getExpiredEmailHtml(companyName: string, renewUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:#1C1712;padding:10px 20px;border-radius:12px;">
        <span style="font-size:18px;font-weight:900;color:#F59E0B;">GK</span>
        <span style="font-size:14px;color:#fff;font-weight:700;">CRM</span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#fff;border:1px solid #E2D9C8;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(28,23,18,0.07);">

      <!-- Top banner -->
      <div style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:28px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🔒</div>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.3;">
          Your subscription has expired
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">
          Renew immediately to restore access
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <p style="margin:0 0 8px;font-size:15px;color:#1C1712;font-weight:600;">
          Hi ${companyName} Team,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
          Your GK CRM subscription has <strong style="color:#DC2626;">expired</strong>. 
          Your data is safe — renew now to restore full access to your pipeline, leads, and team.
        </p>

        <!-- Warning box -->
        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#DC2626;">⚠ Access Suspended</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6B7280;">Dashboard, leads, pipeline, finance — all features are currently locked.</p>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;">
          <a href="${renewUrl}"
            style="display:inline-block;background:linear-gradient(135deg,#B8860B,#D97706);color:#fff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.01em;box-shadow:0 4px 20px rgba(184,134,11,0.3);">
            Renew Now — ₹10,000 →
          </a>
        </div>

        <p style="text-align:center;font-size:12px;color:#9A8F82;margin-top:16px;">
          Instant activation after payment
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #F0EBE1;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9A8F82;">
          Need help? Contact us at 
          <a href="mailto:support@gkcrm.in" style="color:#B8860B;font-weight:600;text-decoration:none;">support@gkcrm.in</a>
        </p>
      </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#C4BAB0;margin-top:24px;">
      GK CRM · Interior Design Pipeline · © 2026
    </p>
  </div>
</body>
</html>
  `
}