import "server-only";

// ---------------------------------------------------------------
// Minimal Resend client using fetch (no SDK).
// Uses RESEND_API_KEY + EMAIL_FROM env vars.
// If RESEND_API_KEY isn't set, sends are silently skipped and
// logged — so missing env in preview environments doesn't break
// auth or competition-join flows.
// ---------------------------------------------------------------

const RESEND_URL = "https://api.resend.com/emails";

function fromAddress(): string {
  return process.env.EMAIL_FROM || "Nana Forex <onboarding@resend.dev>";
}

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "send_failed" | "exception" };

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send", {
      to: input.to,
      subject: input.subject,
    });
    return { ok: false, reason: "not_configured" };
  }

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8_000);
    let res: Response;
    try {
      res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress(),
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo,
        }),
        signal: ac.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend rejected", {
        status: res.status,
        body,
        to: input.to,
      });
      return { ok: false, reason: "send_failed" };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[email] send threw", { to: input.to, err: e });
    return { ok: false, reason: "exception" };
  }
}
