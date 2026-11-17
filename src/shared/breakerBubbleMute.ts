/**
 * Per-agent mute for the circuit-breaker think bubble (#291).
 *
 * Muting hides only the bubble text on the office floor. The breaker itself,
 * the looping glyph, the ⚠ marker in the Command Center and the token limit
 * enforcement are untouched.
 */
export const BREAKER_BUBBLE_MUTE_KEY = 'cth.mutedBreakerBubbles';

/** Sentinel entry in the list meaning "every agent" (global mute). */
export const ALL_AGENTS_MUTED = '*';

/** True when `agentId` (or everyone, via the global sentinel) is muted. */
export function isBubbleMuted(list: readonly string[], agentId: string): boolean {
  return list.includes(ALL_AGENTS_MUTED) || list.includes(agentId);
}

/** Minimal Storage surface so this stays testable outside a browser. */
export interface MuteStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Parse the persisted mute list; any malformed value reads as "nothing muted". */
export function parseMutedAgents(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    return [];
  }
}

export function readMutedAgents(storage: MuteStorage | undefined): string[] {
  try {
    return parseMutedAgents(storage?.getItem(BREAKER_BUBBLE_MUTE_KEY));
  } catch {
    return [];
  }
}

/** Returns the new list with `agentId` muted/unmuted (no duplicates). */
export function withMuted(list: readonly string[], agentId: string, muted: boolean): string[] {
  const rest = list.filter((id) => id !== agentId);
  return muted ? [...rest, agentId] : rest;
}

export function writeMutedAgents(storage: MuteStorage | undefined, list: readonly string[]): void {
  try {
    storage?.setItem(BREAKER_BUBBLE_MUTE_KEY, JSON.stringify(list));
  } catch { /* storage unavailable or full — the mute just won't persist */ }
}
