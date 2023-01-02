const HTTPMethods = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'TRACE',
  'OPTIONS',
  'CONNECT',
] as const;

type HTTPMethod = typeof HTTPMethods[number];

/**
 * The interface that has some additional properties which are supported by some implementations.
 */
interface GMRequestCompatible<TContext = undefined> extends GM.Request<TContext> {
  // for GreaseMonkey
  withCredentials?: boolean;
  // for Tampermonkey
  anonymous?: boolean;
}

type GMHeaders = GM.Request<undefined>['headers'];

/**
 * A type for return value of GM.xmlHttpRequest.
 *
 * GreaseMonkey: Not supported
 * Tampermonkey: Supported
 * Violentmonkey: Supported
 */
type GMXHRControl = { abort: () => void } | undefined;

const isHTTPMethod = (s: string): s is HTTPMethod => (HTTPMethods as readonly string[]).includes(s);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isBlob = (e: any): e is Blob => e != null && e instanceof Blob;

const checkHTTPMethod = (s: string): HTTPMethod => {
  if (!isHTTPMethod(s)) {
    throw new Error('Not HTTP Method');
  }
  return s;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkBlob = (e: any): Blob => {
  if (!isBlob(e)) {
    throw new Error('Not a Blob');
  }
  return e;
};

const buildGMHeaders = (headers: Headers): GMHeaders => {
  return Object.fromEntries(headers.entries());
};

/**
 * Encode binary data as isomorphic-encoded string.
 *
 * Binary data cannot be encoded as JavaScript string directly
 * because some binary data may contain some binary sequences
 * which are treated specially in the text encoding.
 * GM.xmlhttpRequest requires that each single byte (uint8) is encoded as CharCode.
 * By doing this, it is possible for GM.xmlHttpRequest to obtain the original binary data.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/btoa
 * https://infra.spec.whatwg.org/#isomorphic-encode
 * https://infra.spec.whatwg.org/#isomorphic-decode
 *
 * GreaseMonkey
 *   https://github.com/greasemonkey/greasemonkey/blob/efd22a93121225ada47f2fe9f021af0ab6100c21/src/bg/on-user-script-xhr.js#L140-L146
 */
export const encodeArrayBufferAsIsomorphicEncodedString = (b: ArrayBuffer): string => {
  const view = new Uint8Array(b);
  const batch = 1024;
  const result = [];
  for (let i = 0; i < view.length; i += batch) {
    const str = String.fromCharCode(...view.subarray(i, i + batch));
    result.push(str);
  }

  return result.join('');
};

const buildData = async (request: Request): Promise<string | undefined> => {
  const arrayBuffer = await request.arrayBuffer();
  const result = encodeArrayBufferAsIsomorphicEncodedString(arrayBuffer);
  if (result.length === 0) return undefined;
  return result;
};

const buildWithCredentials = (request: Request, location: Location): boolean => {
  const url = new URL(request.url);

  switch (request.credentials) {
    case 'include':
      return true;
    case 'same-origin':
      return location.origin === url.origin;
    case 'omit':
      return false;
    default:
      throw new TypeError('Unknown credentials type.');
  }
};

const buildDetails = async (request: Request): Promise<GMRequestCompatible> => {
  if (request.redirect !== 'follow') {
    throw new TypeError('Only follow is supported');
  }

  const withCredentials = buildWithCredentials(request, globalThis.location);

  const headers = buildGMHeaders(request.headers);

  return {
    method: checkHTTPMethod(request.method),
    url: request.url,
    headers,
    binary: true,
    timeout: undefined,
    responseType: 'blob',
    data: await buildData(request),
    // Whether to include credentials
    // for Tampermonkey
    anonymous: !withCredentials,
    // for GreaseMonkey
    withCredentials,
  };
};

/**
 * Parse response headers string and covert it to Headers object.
 *
 * https://developer.mozilla.org/ja/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
 */
export const parseXHRHeaders = (gmHeaders: string | null): Headers => {
  const headers = new Headers();

  if (gmHeaders == null) {
    return headers;
  }

  const trimmedHeaders = gmHeaders.trim();

  if (trimmedHeaders.length === 0) {
    return headers;
  }

  // These `name` and `value` contains the last value
  let name = '';
  let value = '';
  // According to 2.2 [RFC9112], a recipient may recognize LF(\n) as a line terminator and ignore CR(\r).
  // However, this implementation strictly requires a sequence CRLF('\r\n') for Firefox-styled multi-lined Set-Cookie.
  // Firefox XHR returns multiple Set-Cookie as LF(\n) separated lines.
  trimmedHeaders.split(/(\r\n)+/).forEach((line) => {
    const index = line.indexOf(':');
    // The line with no colon (:) is ignored.
    if (index < 0) {
      // According to 3.2.2 [RFC9112], obs-fold should be replaced with SP
      if (/^[ \t]/.test(line) && name.length > 0 && value.length > 0) {
        const appendValue = line.trim();
        headers.set(name, `${value} ${appendValue}`);
      }
      return;
    }

    name = line.substring(0, index);
    value = line.substring(index + 1).trim();

    // Prohibited headers
    if (/set-cookie2?/i.test(name)) return;

    // Ignore if name is empty or some invalid character is used in name.
    if (!/^[-!#$%&'*+.^|~\d\w]+$/.test(name)) return;

    // Check that only allowed character is used in value. Ignored if invalid.
    if (!/^[ \t\x21-\x7e\x80-\xff]*$/.test(value)) return;

    // Combine fields 5.3 [RFC9110]
    const currentValue = headers.get(name);
    if (currentValue != null) {
      value = `${currentValue}, ${value}`;
    }

    headers.set(name, value);
  });

  return headers;
};

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

    const match = integrity.match(/^(sha(?:256|384|512))-([a-zA-Z0-9+/=]+)$/);

    if (!match) {
      throw new TypeError('unsupported alg or integrity format');
    }

    const [, alg, expected] = match;

    const hashAlgorithm = algHash[alg] || alg;
    const digest = await globalThis.crypto.subtle.digest(hashAlgorithm, await data.arrayBuffer());
    const actual = btoa(encodeArrayBufferAsIsomorphicEncodedString(digest));
    if (actual !== expected) {
      throw new Error('Integrity verification failed');
    }
  };

export const verifyIntegrity = verifyIntegrityWith(globalThis.crypto);

/**
 * Convert GM.Response to Response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildResponse = (res: GM.Response<any>): Response => {
  const body = checkBlob(res.response);

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: parseXHRHeaders(res.responseHeaders),
  });
};

/**
 * Support status:
 *   init:
 *     - mode:           Ignored.
 *     - credentials:    Supported.
 *     - cache:          Ignored.
 *     - redirect:       Ignored. (if non-"follow" value is specified, error log will be printed.)
 *     - integrity:      Partially supported. Multiple integrities are not supported.
 *     - signal:         Supported (only in Tampermonkey and Violentmonkey).
 *     - referrer:       Ignored. TBD.
 *     - referrerPolicy: Ignored
 *   response object:
 *     - redirect: always false even if redirect.
 *     - type:     always "default"
 *
 * GreaseMonkey: https://wiki.greasespot.net/GM.xmlHttpRequest
 *   https://github.com/greasemonkey/greasemonkey/blob/efd22a93121225ada47f2fe9f021af0ab6100c21/src/bg/api-provider-source.js#L252
 *   https://github.com/greasemonkey/greasemonkey/blob/efd22a93121225ada47f2fe9f021af0ab6100c21/src/bg/on-user-script-xhr.js#L23
 *
 * Tampermonkey https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest
 *   NOTE: very old version of Tampermonkey
 *   https://github.com/Tampermonkey/tampermonkey/blob/07f668cd1cabb2939220045839dec4d95d2db0c8/src/xmlhttprequest.js
 *
 * Violentmonkey: https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest
 *
 * Fetch Standard https://fetch.spec.whatwg.org/#fetch-method
 */
const gmFetch = async (
  resource: RequestInfo,
  init: RequestInit | undefined = {},
): Promise<Response> => {
  if (GM.xmlHttpRequest == null) {
    throw new TypeError('GM.xmlHttpRequest is not listed in @grant.');
  }

  const request = new Request(resource, init);
  const details = await buildDetails(request);

  if (request.signal.aborted) {
    throw new DOMException('The request was aborted.', 'AbortError');
  }

  return new Promise((resolve, reject) => {
    const control = GM.xmlHttpRequest({
      ...details,
      onload(res) {
        const checkAndBuildResponse = async () => {
          if (request.integrity) {
            const body = checkBlob(res.response);
            await verifyIntegrity(request.integrity, body);
          }
          return buildResponse(res);
        };

        checkAndBuildResponse()
          .then((response) => resolve(response))
          .catch((err) => reject(err));
      },
      onerror() {
        reject(new TypeError('NetworkError'));
      },
      ontimeout() {
        reject(new TypeError('TimeoutError'));
      },
      onabort() {
        reject(new DOMException('The request was aborted.', 'AbortError'));
      },
    }) as GMXHRControl;

    if (request.signal !== undefined) {
      if (control != null) {
        request.signal.addEventListener('abort', () => {
          control.abort();
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('abort is not supported in this implementation.');
      }
    }
  });
};

export default gmFetch;
