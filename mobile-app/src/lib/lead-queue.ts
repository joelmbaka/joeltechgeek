/** A compact snapshot of the ordered directory page from which a lead was opened. */
export const QUEUE_PAGE_SIZE = 25;

export type LeadQueueContext = {
  ids: string[];
  offset: number;
  hasMore: boolean;
  view: string;
  industry: string;
  query: string;
};

/** Keep queue IDs in their original order even when saving reorders the database. */
export function nextSnapshotId(ids: readonly string[], currentId: string): string | null {
  const index = ids.indexOf(currentId);
  return index < 0 ? null : ids[index + 1] || null;
}

/**
 * Find the next page after the last still-present lead from our original page.
 * Fetch with overlap because an updated lead might leave the filtered list and
 * cause OFFSET pagination to shift. Never silently jump to the first lead.
 */
export function nextPageAfterSnapshot(
  snapshot: readonly string[],
  fetchedIds: readonly string[],
  fetchedOffset: number,
  fetchedHasMore: boolean,
  pageSize = QUEUE_PAGE_SIZE,
): { ids: string[]; offset: number; hasMore: boolean } | null {
  const known = new Set(snapshot);
  const lastSurvivingId = [...snapshot].reverse().find(id => fetchedIds.includes(id));
  if (!lastSurvivingId) return null;
  const anchorIndex = fetchedIds.indexOf(lastSurvivingId);
  const nextIndex = fetchedIds.findIndex((id, index) => index > anchorIndex && !known.has(id));
  // If the saved lead is still present but moved after the original page,
  // the anchor can be at the end of the refreshed result. In that case the
  // first record outside the original snapshot is the next page candidate.
  // Only use records at/after the original page boundary so an overlapping
  // fetch for a later page cannot jump backwards into the preceding page.
  // One snapshot record is the saved lead itself; after the write it may be
  // removed or moved beyond the page, so the next page can begin one slot
  // before the original page length.
  const boundaryIndex = fetchedOffset + Math.max(0, snapshot.length - 1);
  const fallbackIndex = nextIndex < 0
    ? fetchedIds.findIndex((id, index) => index >= boundaryIndex && !known.has(id))
    : -1;
  const candidateIndex = nextIndex >= 0 ? nextIndex : fallbackIndex;
  if (candidateIndex < 0) return null;
  const ids = fetchedIds.slice(candidateIndex, candidateIndex + pageSize).filter(id => !known.has(id));
  if (!ids.length) return null;
  return {
    ids,
    offset: fetchedOffset + candidateIndex,
    hasMore: fetchedHasMore || candidateIndex + pageSize < fetchedIds.length,
  };
}

/** Clamp route params so a deep link cannot trigger huge pagination requests. */
export function parseQueueIds(value?: string): string[] {
  if (!value || value.length > 3000) return [];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ids = value.split(',').filter(id => uuid.test(id));
  return ids.length <= QUEUE_PAGE_SIZE && ids.length === value.split(',').length ? ids : [];
}
