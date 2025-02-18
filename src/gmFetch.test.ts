import assert from 'assert';
import { buildResponse } from './gmFetch';

import { test } from 'vitest';

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
