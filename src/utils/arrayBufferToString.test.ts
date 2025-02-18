import assert from 'assert';
import { test } from 'vitest';

import arrayBufferToString from './arrayBufferToString';

test('arrayBufferToString should encode all byte data', () => {
  const buffer = new ArrayBuffer(256);
  const input = new Uint8Array(buffer);
  for (let i = 0; i < 256; i += 1) input[i] = i;

  const actual = arrayBufferToString(buffer);
  for (let i = 0; i < 256; i += 1) assert(actual.charCodeAt(i) === i);
});

test('arrayBufferToString should encode long data', () => {
  const buffer = new ArrayBuffer(1024 * 10);
  const input = new Uint8Array(buffer);
  for (let i = 0; i < input.length; i += 1) input[i] = i % 256;

  const actual = arrayBufferToString(buffer);
  for (let i = 0; i < input.length; i += 1) assert(actual.charCodeAt(i) === i % 256);
});

test('arrayBufferToString should return empty string if input is empty', () => {
  const buffer = new ArrayBuffer(0);
  const actual = arrayBufferToString(buffer);
  assert(actual === '');
});
