import { webcrypto } from 'node:crypto';

import assert from 'assert';
import {
  encodeArrayBufferAsIsomorphicEncodedString,
  parseXHRHeaders,
  buildResponse,
  verifyIntegrityWith,
} from '@/gmFetch';

test('encodeArrayBufferAsIsomorphicEncodedString should encode all byte data', () => {
  const input = new Uint8Array(new ArrayBuffer(256));
  for (let i = 0; i < 256; i += 1) input[i] = i;

  const actual = encodeArrayBufferAsIsomorphicEncodedString(input);
  for (let i = 0; i < 256; i += 1) assert(actual.charCodeAt(i) === i);
});

test('encodeArrayBufferAsIsomorphicEncodedString should encode long data', () => {
  const input = new Uint8Array(new ArrayBuffer(1024 * 10));
  for (let i = 0; i < input.length; i += 1) input[i] = i % 256;

  const actual = encodeArrayBufferAsIsomorphicEncodedString(input);
  for (let i = 0; i < input.length; i += 1) assert(actual.charCodeAt(i) === i % 256);
});

test('encodeArrayBufferAsIsomorphicEncodedString should return empty string if input is empty', () => {
  const input = new Uint8Array(new ArrayBuffer(0));

  const actual = encodeArrayBufferAsIsomorphicEncodedString(input);
  assert(actual === '');
});

test('parseXHRHeader should parse standard headers', () => {
  const xhrHeaders =
    'content-type: text/html; charset=utf-8\r\nx-powered-by: Express\r\ncache-control: no-cache, no-store, must-revalidate\r\nlast-modified: Sat, 06 Aug 2022 18:33:05 GMT\r\n';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 4);
  assert(actual.get('Content-Type') === 'text/html; charset=utf-8');
  assert(actual.get('X-Powered-By') === 'Express');
  assert(actual.get('Cache-Control') === 'no-cache, no-store, must-revalidate');
  assert(actual.get('Last-Modified') === 'Sat, 06 Aug 2022 18:33:05 GMT');
});

test('parseXHRHeader should parse headers without preceding SP before value', () => {
  const xhrHeaders =
    'content-type:text/html; charset=utf-8\r\nx-powered-by:Express\r\ncache-control:no-cache, no-store, must-revalidate\r\nlast-modified:Sat, 06 Aug 2022 18:33:05 GMT\r\n';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 4);
  assert(actual.get('Content-Type') === 'text/html; charset=utf-8');
  assert(actual.get('X-Powered-By') === 'Express');
  assert(actual.get('Cache-Control') === 'no-cache, no-store, must-revalidate');
  assert(actual.get('Last-Modified') === 'Sat, 06 Aug 2022 18:33:05 GMT');
});

test('parseXHRHeader should ignore Firefox-styled Set-Cookie lines', () => {
  const xhrHeaders =
    'Content-Type:text/html; charset=utf-8\r\n' +
    'X-Powered-By:Express\r\n' +
    'Set-Cookie: A=123; Expires=Sat, 13 Aug 2022 23:59:59 GMT; Secure; HttpOnly=true; Same-Site=Lax\n' +
    'B=456; Expires=Sat, 13 Aug 2022 23:59:59 GMT; Secure; HttpOnly=true; Same-Site=Lax\n' +
    'C=456; Expires=Sat, 13 Aug 2022 23:59:59 GMT; Secure; HttpOnly=true; Same-Site=Lax\r\n';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 2);
  assert(actual.get('Content-Type') === 'text/html; charset=utf-8');
  assert(actual.get('X-Powered-By') === 'Express');
  assert(actual.get('Set-Cookie') === null);
});

test('parseXHRHeader should parse a header field with obs-fold as a single line', () => {
  const xhrHeaders =
    'Last-Modified: Sat, 06 Aug 2022 18:33:05 GMT\r\n' +
    'Content-Type: text/html;\r\n\tcharset=utf-8\r\n' +
    'X-Powered-By:Express\r\n';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 3);
  assert(actual.get('Content-Type') === 'text/html; charset=utf-8');
  assert(actual.get('Last-Modified') === 'Sat, 06 Aug 2022 18:33:05 GMT');
  assert(actual.get('X-Powered-By') === 'Express');
});

test('parseXHRHeader should return empty Headers if input is null', () => {
  const actual = parseXHRHeaders(null);
  assert([...actual.keys()].length === 0);
});

test('parseXHRHeader should parse empty string', () => {
  const xhrHeaders = '';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 0);
});

test('parseXHRHeader should parse colon contained value ', () => {
  const xhrHeaders = 'A: B: C\r\nD: E: F\r\n';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 2);
  assert(actual.get('A') === 'B: C');
  assert(actual.get('D') === 'E: F');
});

test('parseXHRHeader should ignore colon started lines ', () => {
  const xhrHeaders =
    'Content-Type: text/html; charset=utf-8\r\n' +
    ': B\r\n' +
    ': D\r\n' +
    'X-Powered-By:Express\r\n';
  const actual = parseXHRHeaders(xhrHeaders);
  assert([...actual.keys()].length === 2);
  assert(actual.get('Content-Type') === 'text/html; charset=utf-8');
  assert(actual.get('X-Powered-By') === 'Express');
});

test('buildResponse should return expected Response', async () => {
  const gmResponse: GM.Response<undefined> = {
    readyState: 4,
    status: 200,
    statusText: 'OK',
    response: new Blob(['response']),
    responseHeaders:
      'Content-Type: text/html; charset=UTF-8\r\nServer: Dummy Server 1.2.3\r\nX-Frame-Options: SAMEORIGIN\r\n',
    finalUrl: 'https://example.com/#ignored',
    responseText: 'ignored',
    responseXML: false,
  };

  const actual = buildResponse(gmResponse);

  assert(actual != null);
  assert(actual.status === 200);
  assert(actual.statusText === 'OK');
  assert((await actual.text()) === 'response');
  assert([...actual.headers.keys()].length === 3);
  assert(actual.headers.get('Content-Type') === 'text/html; charset=UTF-8');
  assert(actual.headers.get('Server') === 'Dummy Server 1.2.3');
  assert(actual.headers.get('X-Frame-Options') === 'SAMEORIGIN');
});

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
