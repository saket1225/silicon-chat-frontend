// Email helpers for sign-up. We nudge people toward a personal email at sign-up
// (so they keep access to the interface across jobs); a work email is asked for
// later, when joining a team's Silicon.

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "mail.com",
  "mail.ru",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tuta.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isPersonalEmail(email: string): boolean {
  return PERSONAL_EMAIL_DOMAINS.has(emailDomain(email));
}

/**
 * True when the address is a valid email that is NOT a known personal provider —
 * i.e. it looks like a work/company address, which is when we surface the nudge.
 */
export function looksLikeWorkEmail(email: string): boolean {
  return isValidEmail(email) && !isPersonalEmail(email);
}

/** Suggest a Carbon ID from the email local-part, cleaned to the allowed charset. */
export function suggestCarbonId(email: string): string {
  const local = (email.split("@")[0] || "").toLowerCase();
  const cleaned = local.replace(/[^a-z0-9._-]/g, "").slice(0, 32);
  return cleaned.length >= 3 ? cleaned : "";
}
