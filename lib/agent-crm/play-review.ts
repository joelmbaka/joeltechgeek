/**
 * Google Play review access is deliberately independent of Joel's real agent
 * identity. Anyone with the public APK can tap the button, so this gate MUST
 * only ever grant access to the separate synthetic review agent.
 *
 * Both settings are required to fail closed. Disable the boolean after review:
 * every existing review access/refresh token will immediately stop working.
 */
export const PLAY_REVIEW_AGENT_EMAIL = 'play-review@joeltechgeek.invalid';

export function playReviewEnabled(now = Date.now()): boolean {
  if (process.env.CRM_PLAY_REVIEW_ENABLED !== 'true') return false;
  const until = process.env.CRM_PLAY_REVIEW_UNTIL?.trim();
  if (!until || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(until)) return false;
  const expiresAt = Date.parse(until);
  return Number.isFinite(expiresAt) && now < expiresAt;
}
