import { webcrypto } from 'node:crypto';

import { verifyIntegrityWith } from './verifyIntegrity';

import { test, expect } from 'vitest';

test('verifyIntegrity should deny malformed integrity', async () => {
  const verifyIntegrity = verifyIntegrityWith(webcrypto as Crypto);

  await expect(async () => verifyIntegrity('', new Blob([]))).rejects.toThrow();
  await expect(async () => verifyIntegrity('sha256-', new Blob([]))).rejects.toThrow();
  await expect(async () => verifyIntegrity('sha384-', new Blob([]))).rejects.toThrow();
  await expect(async () => verifyIntegrity('sha512-', new Blob([]))).rejects.toThrow();
});

test('verifyIntegrity should allow valid integrity', async () => {
  const verifyIntegrity = verifyIntegrityWith(webcrypto as Crypto);

  const input = new Uint8Array(new ArrayBuffer(256));
  for (let i = 0; i < input.length; i += 1) input[i] = i;

  const sha256Integrity = 'sha256-QK/y6dLYki5Hr9RkjmlnSXFYeF+9Hahw5xECZr+USIA=';
  await verifyIntegrity(sha256Integrity, new Blob([input]));

  const sha384Integrity = 'sha384-/9rr/2XtBc9ADwIhxMz7SyEE+2pR+H5AvmxDCThr/ewokukXmzRjIzGllZJzfbXF';
  await verifyIntegrity(sha384Integrity, new Blob([input]));

  const sha512Integrity =
    'sha512-HnuAvI7cVSyP7rJ4DhEUd+W8cEZfrBp3sps1mAw/DOSgNqbJRiA2gkvVaAHmKvfp/rpcIu2KWvh3v33hF9ysbQ==';
  await verifyIntegrity(sha512Integrity, new Blob([input]));
});

test('verifyIntegrity should deny invalid integrity', async () => {
  const verifyIntegrity = verifyIntegrityWith(webcrypto as Crypto);

  const input = new Uint8Array(new ArrayBuffer(256));
  for (let i = 0; i < input.length; i += 1) input[i] = i;

  await expect(async () => {
    const sha256Integrity = 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    await verifyIntegrity(sha256Integrity, new Blob([input]));
  }).rejects.toThrow();

  await expect(async () => {
    const sha384Integrity =
      'sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    await verifyIntegrity(sha384Integrity, new Blob([input]));
  }).rejects.toThrow();

  await expect(async () => {
    const sha512Integrity =
      'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    await verifyIntegrity(sha512Integrity, new Blob([input]));
  }).rejects.toThrow();
});
