import { Resend } from "resend";

const FROM_ADDRESS = "Guardian Trading <support@guardiiantrading.com>";
const LOGO_URL = "https://guardiiantrading.com/logo.png";
const SUPPORT_EMAIL = "support@guardiiantrading.com";
const COMPANY_LINE = "Guardian Trading &mdash; A Division of Velocity Clearing, LLC. Member FINRA/SIPC.";
const ADDRESS_LINE = "1301 Route 36, Suite 109, Hazlet, NJ 07730";

// ---------------------------------------------------------------------------
// Shared email shell — wraps any content in the branded card layout
// ---------------------------------------------------------------------------
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Guardian Trading</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">

  <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#eef1f6;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Outer card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;
                      border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td align="center"
                style="background:linear-gradient(135deg,#0d1b2e 0%,#1a3560 100%);
                       padding:36px 40px 28px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <img src="${LOGO_URL}"
                         alt="Guardian Trading"
                         width="48" height="48"
                         style="display:block;width:48px;height:48px;
                                object-fit:contain;margin:0 auto 14px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:11px;font-weight:700;
                               color:#5baad4;letter-spacing:0.12em;
                               text-transform:uppercase;">GUARDIAN TRADING</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Blue accent line -->
          <tr>
            <td style="background:linear-gradient(90deg,#3a7bd5,#5baad4);
                        height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body content injected here -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="background:#f5f7fa;border-top:1px solid #e4e9f0;
                        padding:24px 40px;">
              <p style="margin:0 0 6px;font-size:12px;color:#8a96a8;
                         line-height:1.7;text-align:center;">
                ${COMPANY_LINE}<br/>
                ${ADDRESS_LINE}
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#8a96a8;text-align:center;">
                Need help?&nbsp;
                <a href="mailto:${SUPPORT_EMAIL}"
                   style="color:#3a7bd5;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Outer card -->

      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Shared code-box block used by verification and password-reset emails
// ---------------------------------------------------------------------------
function codeBox(label: string, code: string, accentColor: string, bgColor: string, borderColor: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="margin:28px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center"
                style="background:${bgColor};border:2px solid ${borderColor};
                       border-radius:10px;padding:22px 52px;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;
                         color:${accentColor};letter-spacing:0.14em;
                         text-transform:uppercase;">${label}</p>
              <p style="margin:0;font-size:40px;font-weight:800;
                         color:#0d1b2e;letter-spacing:0.22em;
                         font-family:'Courier New',Courier,monospace;">${code}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Resend credentials helper
// ---------------------------------------------------------------------------
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
        console.log("[Mailer] Using Resend credentials from Replit connector");
        return { apiKey: settings.api_key, fromEmail: settings.from_email };
      }
      console.warn("[Mailer] Replit connector responded but no api_key found:", JSON.stringify(data.items?.[0] ?? {}));
    } catch (err) {
      console.warn("[Mailer] Failed to fetch Resend credentials from connector:", err);
    }
  }

  const apiKey = process.env["RESEND_API_KEY"];
  if (apiKey) {
    console.log("[Mailer] Using Resend credentials from RESEND_API_KEY env var");
    return { apiKey };
  }

  console.error(
    "[Mailer] No Resend credentials found. " +
    "Set RESEND_API_KEY as an environment secret, or configure the Resend connector. " +
    "Emails will NOT be sent until this is resolved."
  );
  return null;
}

// ---------------------------------------------------------------------------
// Account Verified Email
// ---------------------------------------------------------------------------
export async function sendAccountVerifiedEmail(
  to: string,
  firstName?: string
): Promise<{ success: boolean; error?: string }> {
  const creds = await getResendCredentials();
  if (!creds) {
    return { success: false, error: "Email service not configured — RESEND_API_KEY is missing" };
  }

  const name = firstName ?? to.split("@")[0];
  const client = new Resend(creds.apiKey);

  const body = `
  <tr>
    <td style="padding:36px 40px 8px;">
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0d1b2e;">
        Account Verified
      </h1>
      <p style="margin:0;font-size:13px;color:#8a96a8;text-transform:uppercase;
                 letter-spacing:0.06em;font-weight:600;">Identity Confirmation</p>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 40px 36px;">
      <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
        Dear ${name},
      </p>
      <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
        Congratulations — your Guardian Trading account has been
        <strong style="color:#0d1b2e;">approved and verified</strong>.
        Your application has been reviewed and you are now fully cleared to access your
        trading account.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center"
                    style="background:#f0fdf4;border:2px solid #16a34a;
                           border-radius:10px;padding:22px 52px;">
                  <p style="margin:0 0 8px;font-size:28px;">&#10003;</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#16a34a;">
                    Account Verified
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.7;">
        You can now log in to the Guardian Trading portal and begin trading.
        If you have any questions, reach out to our support team at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#3a7bd5;text-decoration:none;">${SUPPORT_EMAIL}</a>
        or call <a href="tel:8886020092" style="color:#3a7bd5;text-decoration:none;">888-602-0092</a>.
      </p>
    </td>
  </tr>`;

  const html = emailShell(body);

  try {
    const result = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Account Verified Successfully — Guardian Trading",
      html,
    });
    if (result.error) {
      console.error(`[Mailer] Failed to send verified email to ${to}:`, result.error);
      return { success: false, error: result.error.message };
    }
    console.log(`[Mailer] Verified email sent to ${to} — id: ${result.data?.id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Mailer] Exception sending verified email to ${to}:`, msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Password Reset Email
// ---------------------------------------------------------------------------
export async function sendPasswordResetEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const creds = await getResendCredentials();
  if (!creds) {
    console.error(`[Mailer] Cannot send password reset to ${to} — no email credentials configured`);
    return { success: false, error: "Email service not configured — RESEND_API_KEY is missing" };
  }

  const client = new Resend(creds.apiKey);

  const body = `
  <tr>
    <td style="padding:36px 40px 8px;">
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0d1b2e;">
        Password Reset Request
      </h1>
      <p style="margin:0;font-size:13px;color:#8a96a8;text-transform:uppercase;
                 letter-spacing:0.06em;font-weight:600;">Security Code</p>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 40px 36px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        We received a request to reset your Guardian Trading account password.
        Use the code below to set a new password. Do not share this code with anyone.
      </p>

      ${codeBox("Reset Code", code, "#92400e", "#fffbeb", "#d97706")}

      <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">
        This code expires in <strong style="color:#0d1b2e;">10 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#8a96a8;line-height:1.7;">
        If you did not request a password reset, you can safely ignore this email —
        your account remains secure.
      </p>
    </td>
  </tr>`;

  const html = emailShell(body);

  try {
    const result = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Password Reset Code — Guardian Trading",
      html,
    });
    if (result.error) {
      console.error(`[Mailer] Failed to send reset email to ${to}:`, result.error);
      return { success: false, error: result.error.message };
    }
    console.log(`[Mailer] Password reset email sent to ${to} — id: ${result.data?.id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Mailer] Exception sending reset email to ${to}:`, msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Verification Email
// ---------------------------------------------------------------------------
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const creds = await getResendCredentials();
  if (!creds) {
    console.error(`[Mailer] Cannot send verification email to ${to} — no email credentials configured`);
    return { success: false, error: "Email service not configured — RESEND_API_KEY is missing. Please contact support." };
  }

  const client = new Resend(creds.apiKey);

  const body = `
  <tr>
    <td style="padding:36px 40px 8px;">
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0d1b2e;">
        Verify Your Email Address
      </h1>
      <p style="margin:0;font-size:13px;color:#8a96a8;text-transform:uppercase;
                 letter-spacing:0.06em;font-weight:600;">Email Verification</p>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 40px 36px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Thank you for starting your Guardian Trading application. Enter the code
        below to verify your email address and continue your onboarding.
      </p>

      ${codeBox("Verification Code", code, "#1d4ed8", "#eff6ff", "#3a7bd5")}

      <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">
        This code expires in <strong style="color:#0d1b2e;">10 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#8a96a8;line-height:1.7;">
        If you did not create a Guardian Trading account, you can safely ignore
        this email.
      </p>
    </td>
  </tr>`;

  const html = emailShell(body);

  try {
    const result = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Your Verification Code — Guardian Trading",
      html,
    });
    if (result.error) {
      console.error(`[Mailer] Resend API error sending to ${to}:`, JSON.stringify(result.error));
      return { success: false, error: result.error.message };
    }
    console.log(`[Mailer] Verification email sent to ${to} — id: ${result.data?.id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Mailer] Exception sending verification email to ${to}:`, msg);
    return { success: false, error: msg };
  }
}
