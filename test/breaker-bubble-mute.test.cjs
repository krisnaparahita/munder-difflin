'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const {
  BREAKER_BUBBLE_MUTE_KEY, parseMutedAgents, readMutedAgents, withMuted, writeMutedAgents
} = loadTs('src/shared/breakerBubbleMute.ts');

const memStore = (init) => {
  const m = new Map(init ? [[BREAKER_BUBBLE_MUTE_KEY, init]] : []);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, v) };
};

test('parseMutedAgents tolerates missing and malformed values', () => {
  assert.deepEqual(parseMutedAgents(null), []);
  assert.deepEqual(parseMutedAgents(''), []);
  assert.deepEqual(parseMutedAgents('{oops'), []);
  assert.deepEqual(parseMutedAgents('{"a":1}'), []);
  assert.deepEqual(parseMutedAgents('["a",3,"",null,"b"]'), ['a', 'b']);
});

test('withMuted adds once and removes cleanly', () => {
  assert.deepEqual(withMuted([], 'a', true), ['a']);
  assert.deepEqual(withMuted(['a'], 'a', true), ['a']);
  assert.deepEqual(withMuted(['a', 'b'], 'a', false), ['b']);
  assert.deepEqual(withMuted(['b'], 'a', false), ['b']);
});

test('mute list round-trips through storage', () => {
  const s = memStore();
  writeMutedAgents(s, withMuted([], 'jim', true));
  assert.deepEqual(readMutedAgents(s), ['jim']);
});

test('storage failures never throw', () => {
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepEqual(readMutedAgents(broken), []);
  assert.doesNotThrow(() => writeMutedAgents(broken, ['a']));
  assert.deepEqual(readMutedAgents(undefined), []);
});

test('isBubbleMuted honors the per-agent entry and the global sentinel', () => {
  const { ALL_AGENTS_MUTED, isBubbleMuted } = loadTs('src/shared/breakerBubbleMute.ts');
  assert.equal(isBubbleMuted([], 'a'), false);
  assert.equal(isBubbleMuted(['a'], 'a'), true);
  assert.equal(isBubbleMuted(['a'], 'b'), false);
  assert.equal(isBubbleMuted([ALL_AGENTS_MUTED], 'b'), true);
});
