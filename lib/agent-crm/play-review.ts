/**
 * Google Play reviewer access is intentionally a code-controlled feature.
 *
 * Public builds may contain the button: it MUST only grant access to the
 * separate synthetic Play Review user, never a real user's identity.
 *
 * Keep this enabled during Play review and later app update reviews.
 * To disable: change the constant to false and deploy the Next.js backend.
 * Both new logins and existing review sessions will be rejected immediately.
 * No environment variables, expiry dates or credentials are stored in the app.
 */
export const PLAY_REVIEW_USER_EMAIL = 'play-review@joeltechgeek.invalid';
export const PLAY_REVIEW_ACCESS_ENABLED = true;

export function playReviewEnabled(): boolean {
  return PLAY_REVIEW_ACCESS_ENABLED;
}
