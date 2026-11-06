/**
 * Synthetic Play Review account gate.
 *
 * Production remains disabled unless explicitly enabled for an active review.
 * Local developers may OPT IN by starting Next.js with
 * CRM_ENABLE_LOCAL_REVIEW_ACCESS=true in a NODE_ENV=development session.
 * A production server never honors this local QA flag.
 *
 * Only the synthetic play-review@joeltechgeek.invalid identity is granted.
 */
export const PLAY_REVIEW_USER_EMAIL = 'play-review@joeltechgeek.invalid';
export const PLAY_REVIEW_ACCESS_ENABLED = false;

export function playReviewEnabled(): boolean {
  return PLAY_REVIEW_ACCESS_ENABLED ||
    (process.env.NODE_ENV === 'development' &&
     process.env.CRM_ENABLE_LOCAL_REVIEW_ACCESS === 'true');
}
