import { Resend } from "resend";

const FROM_ADDRESS = "Guardian Trading <noreply@guardiantrading.com>";

// Resend integration via Replit connector
async function getResendCredentials(): Promise<{ apiKey: string; fromEmail?: string } | null> {
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
        {
          headers: {
            Accept: "application/json",
            "X-Replit-Token": xReplitToken,
          },
        }
      );
      const data = await resp.json() as { items?: Array<{ settings?: { api_key?: string; from_email?: string } }> };
      const settings = data.items?.[0]?.settings;
      if (settings?.api_key) {
        return { apiKey: settings.api_key, fromEmail: settings.from_email };
      }
    } catch (err) {
      console.warn("[Mailer] Failed to fetch Resend credentials from connector:", err);
    }
  }

  // Fallback: plain env var
  const apiKey = process.env["RESEND_API_KEY"];
  if (apiKey) {
    return { apiKey };
  }

  return null;
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const creds = await getResendCredentials();

  if (!creds) {
    console.warn("[Mailer] No Resend credentials available — logging code to console instead");
    console.log(`[Mailer] DEV — verification code for ${to}: ${code}`);
    return { success: true };
  }

  const client = new Resend(creds.apiKey);
  const fromAddress = creds.fromEmail ? `Guardian Trading <${creds.fromEmail}>` : FROM_ADDRESS;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;border:1px solid #dde3e9;overflow:hidden;">
          <!-- Blue top stripe -->
          <tr><td style="background:#3a7bd5;height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e8edf2;">
              <p style="margin:0;font-size:11px;font-weight:700;color:#5baad4;letter-spacing:0.08em;text-transform:uppercase;">GUARDIAN TRADING</p>
              <h1 style="margin:10px 0 0;font-size:22px;color:#1c2e3e;font-weight:700;">Your Verification Code</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">
                Thank you for starting your Guardian Trading application. Use the code below to verify your email address and continue.
              </p>

              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#e8f0fb;border:2px solid #3a7bd5;border-radius:8px;padding:20px 48px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#5baad4;letter-spacing:0.1em;text-transform:uppercase;">Verification Code</p>
                      <p style="margin:0;font-size:38px;font-weight:800;color:#1c2e3e;letter-spacing:0.18em;">${code}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;color:#666;line-height:1.6;">
                This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #e8edf2;background:#f9fafc;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
                Guardian Trading — A Division of Velocity Clearing, LLC. Member FINRA/SIPC.<br/>
                1301 Route 36, Suite 109, Hazlet, NJ 07730
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const result = await client.emails.send({
      from: fromAddress,
      to,
      subject: "Your Verification Code",
      html,
    });

    if (result.error) {
      console.error(`[Mailer] Failed to send to ${to}:`, result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Mailer] Email sent to ${to} — id: ${result.data?.id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Mailer] Exception sending to ${to}:`, msg);
    return { success: false, error: msg };
  }
}
