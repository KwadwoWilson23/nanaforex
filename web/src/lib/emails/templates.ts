import "server-only";

// ---------------------------------------------------------------
// Transactional email templates. HTML kept inline + inline styles
// only so email clients (Gmail, Outlook, Apple Mail) render it
// consistently — no external CSS, no <style> block, no web fonts.
// ---------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(previewText: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nana Forex</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0f1e;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#0f172a;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 4px 32px;">
                <div style="font-weight:800;font-size:20px;letter-spacing:0.2px;color:#f5b700;">Nana Forex</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px 32px;line-height:1.55;font-size:15px;color:#e5e7eb;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(229,231,235,0.5);">
                Nana Forex · Trade smarter, together.<br>
                You're getting this because you have an account with us.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:linear-gradient(135deg,#00c896,#00e0a3);color:#0a0f1e;font-weight:800;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:14px;">${escapeHtml(label)}</a>`;
}

// ---------- Welcome ----------

export function welcomeEmail(input: { name: string; dashboardUrl: string }) {
  const name = input.name || "Trader";
  return {
    subject: "Welcome to Nana Forex",
    html: shell(
      `Welcome, ${name}. Your Nana Forex account is ready.`,
      `
        <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;">Welcome, ${escapeHtml(name)} 👋</h1>
        <p style="margin:0 0 14px 0;">Your Nana Forex account is ready. Here's what you can do next:</p>
        <ul style="margin:0 0 18px 20px;padding:0;">
          <li style="margin-bottom:6px;">Join a live trading competition</li>
          <li style="margin-bottom:6px;">Copy trade with verified traders</li>
          <li style="margin-bottom:6px;">Track your performance on the public leaderboard</li>
        </ul>
        <p style="margin:0 0 20px 0;">${button(input.dashboardUrl, "Open my dashboard")}</p>
        <p style="margin:0;color:rgba(229,231,235,0.6);font-size:13px;">Questions? Just reply to this email.</p>
      `,
    ),
    text: `Welcome, ${name}!\n\nYour Nana Forex account is ready.\n\nOpen your dashboard: ${input.dashboardUrl}\n\nQuestions? Reply to this email.`,
  };
}

// ---------- Password reset ----------

export function passwordResetEmail(input: { link: string }) {
  return {
    subject: "Reset your Nana Forex password",
    html: shell(
      "Reset your Nana Forex password.",
      `
        <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;">Reset your password</h1>
        <p style="margin:0 0 16px 0;">Click the button below to choose a new password for your Nana Forex account. This link expires in 1 hour.</p>
        <p style="margin:0 0 20px 0;">${button(input.link, "Reset password")}</p>
        <p style="margin:0 0 12px 0;color:rgba(229,231,235,0.6);font-size:13px;">If the button doesn't work, copy this link into your browser:</p>
        <p style="margin:0;word-break:break-all;color:rgba(229,231,235,0.55);font-size:12px;"><a href="${escapeHtml(input.link)}" style="color:#00e0a3;text-decoration:underline;">${escapeHtml(input.link)}</a></p>
        <p style="margin:20px 0 0 0;color:rgba(229,231,235,0.55);font-size:12px;">Didn't ask for a reset? You can ignore this email — your password won't change.</p>
      `,
    ),
    text: `Reset your Nana Forex password by opening this link (expires in 1 hour):\n\n${input.link}\n\nDidn't ask for a reset? Ignore this email.`,
  };
}

// ---------- Competition joined ----------

export function competitionJoinedEmail(input: {
  name: string;
  competitionName: string;
  competitionUrl: string;
  prizePool?: number | null;
}) {
  const name = input.name || "Trader";
  const prizeLine = input.prizePool
    ? `<p style="margin:0 0 12px 0;"><strong style="color:#f5b700;">Prize pool: $${Number(input.prizePool).toLocaleString()}</strong></p>`
    : "";
  return {
    subject: `You're in — ${input.competitionName}`,
    html: shell(
      `You've joined ${input.competitionName}.`,
      `
        <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;">You're in! 🏆</h1>
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)}, you've joined <strong>${escapeHtml(input.competitionName)}</strong>.</p>
        ${prizeLine}
        <p style="margin:0 0 16px 0;"><strong>Next step:</strong> connect your MT5 investor (read-only) password so we can put you on the live leaderboard. It takes 30 seconds.</p>
        <p style="margin:0 0 20px 0;">${button(input.competitionUrl, "Connect my account")}</p>
        <p style="margin:0;color:rgba(229,231,235,0.6);font-size:13px;">Your investor password only lets us <em>read</em> the account — we can never place trades, transfer funds, or change anything. Never share your master password.</p>
      `,
    ),
    text: `Hi ${name},\n\nYou've joined ${input.competitionName}.\n\nNext step — connect your MT5 investor password to go live on the leaderboard:\n${input.competitionUrl}\n\nYour investor password is read-only. We can never trade your account.`,
  };
}
