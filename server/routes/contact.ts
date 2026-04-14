import { Router, type IRouter } from "express";
import { Resend } from "resend";
import { sensitiveEndpointLimit } from "../middleware/security.js";
import { validate, ContactSchema } from "../lib/validation.js";
import { sanitizeForEmail } from "../lib/sanitize.js";

const router: IRouter = Router();

async function getResendClient(): Promise<Resend | null> {
  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const replIdentity = process.env["REPL_IDENTITY"];
  const webReplRenewal = process.env["WEB_REPL_RENEWAL"];

  const xReplitToken = replIdentity
    ? "repl " + replIdentity
    : webReplRenewal
    ? "depl " + webReplRenewal
    : null;

  if (hostname && xReplitToken) {
    try {
      const resp = await fetch(
        "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
        { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
      );
      const data = await resp.json() as { items?: Array<{ settings?: { api_key?: string } }> };
      const apiKey = data.items?.[0]?.settings?.api_key;
      if (apiKey) return new Resend(apiKey);
    } catch {
      // fall through
    }
  }

  const apiKey = process.env["RESEND_API_KEY"];
  if (apiKey) return new Resend(apiKey);

  return null;
}

router.post("/contact", sensitiveEndpointLimit, validate(ContactSchema), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body as {
      name: string; email: string; subject: string; message: string;
    };

    const safeName = sanitizeForEmail(name);
    const safeEmail = sanitizeForEmail(email);
    const safeSubject = sanitizeForEmail(subject);
    const safeMessage = sanitizeForEmail(message);

    const client = await getResendClient();

    if (client) {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Contact Form</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;border:1px solid #dde3e9;overflow:hidden;">
        <tr><td style="background:#3a7bd5;height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #e8edf2;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#5baad4;letter-spacing:0.08em;text-transform:uppercase;">GUARDIAN TRADING</p>
            <h1 style="margin:10px 0 0;font-size:20px;color:#1c2e3e;font-weight:700;">New Contact Form Submission</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;"><strong style="color:#555;font-size:13px;">Name:</strong> <span style="color:#333;font-size:14px;">${safeName}</span></td></tr>
              <tr><td style="padding:6px 0;"><strong style="color:#555;font-size:13px;">Email:</strong> <a href="mailto:${safeEmail}" style="color:#3a7bd5;font-size:14px;">${safeEmail}</a></td></tr>
              <tr><td style="padding:6px 0;"><strong style="color:#555;font-size:13px;">Subject:</strong> <span style="color:#333;font-size:14px;">${safeSubject}</span></td></tr>
              <tr><td style="padding:16px 0 6px;"><strong style="color:#555;font-size:13px;">Message:</strong></td></tr>
              <tr><td style="background:#f9fafc;border:1px solid #e8edf2;border-radius:4px;padding:16px;font-size:14px;color:#333;line-height:1.7;">${safeMessage.replace(/\n/g, "<br/>")}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #e8edf2;background:#f9fafc;">
            <p style="margin:0;font-size:12px;color:#aaa;">Guardian Trading — A Division of Velocity Clearing, LLC. Member FINRA/SIPC.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await client.emails.send({
        from: "Guardian Trading <noreply@guardiiantrading.com>",
        to: "info@guardiiantrading.com",
        replyTo: email.trim(),
        subject: `Contact Form: ${safeSubject}`,
        html,
      });
    } else {
      console.log(`[Contact] Email not sent (no Resend key). From: ${email} — Subject: ${subject}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Contact] Error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

export default router;
