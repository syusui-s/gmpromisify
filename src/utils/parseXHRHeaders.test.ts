import assert from 'assert';
import { test } from 'vitest';

import parseXHRHeaders from '@/utils/parseXHRHeaders';

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
