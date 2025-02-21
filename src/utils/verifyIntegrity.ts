import arrayBufferToString from './arrayBufferToString';

const algHash: Record<string, string> = {
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

/**
 * https://w3c.github.io/webappsec-subresource-integrity/#the-integrity-attribute
 */
export const verifyIntegrityWith =
  (crypto: Crypto) =>
  async (integrity: string, data: Blob): Promise<void> => {
    if (crypto?.subtle?.digest == null) {
      throw new Error('digest function is not available.');
    }

    const integrities = integrity.trim().split(/\s+/);
    for (const part of integrities) {
      const match = part.match(/^(sha(?:256|384|512))-([a-zA-Z0-9+/=]+)$/);

      if (!match) {
        throw new TypeError('unsupported alg or integrity format');
      }

      const [, alg, expected] = match;

      const hashAlgorithm = algHash[alg] || alg;
      const digest = await globalThis.crypto.subtle.digest(hashAlgorithm, await data.arrayBuffer());
      const actual = btoa(arrayBufferToString(digest));
      if (actual !== expected) {
        throw new Error('Integrity verification failed');
      }
    }
  };

export const verifyIntegrity = verifyIntegrityWith(globalThis.crypto);
