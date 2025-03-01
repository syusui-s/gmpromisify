import arrayBufferToString from './utils/arrayBufferToString';
import parseXHRHeaders from './utils/parseXHRHeaders';
import { verifyIntegrity } from './utils/verifyIntegrity';

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

type HTTPMethod = (typeof HTTPMethods)[number];

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

const buildData = async (request: Request): Promise<string | undefined> => {
  const arrayBuffer = await request.arrayBuffer();
  const result = arrayBufferToString(arrayBuffer);
  if (result.length === 0) return undefined;
  return result;
};

const buildWithCredentials = (request: Request, location: Location): boolean => {
  const url = new URL(request.url);

  switch (request.credentials) {
    case 'include':
      return true;
    case 'omit':
      return false;
    case 'same-origin':
    default:
      return location.origin === url.origin;
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
    // `credentials`: whether to include cookies
    // for Tampermonkey
    anonymous: !withCredentials,
    // for GreaseMonkey
    // not documented but supported
    // https://github.com/greasemonkey/greasemonkey/issues/2826
    // https://github.com/greasemonkey/greasemonkey/pull/2835
    withCredentials,
  };
};

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

const gmFetch = async (
  resource: string | URL | RequestInfo,
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
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
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
    }) as GMXHRControl | undefined;
    // GM.xmlHttpRequest returns undefined in GreaseMonkey
    // but returns GMXHRControl in Tampermonkey and Violentmonkey.

    if (request.signal !== undefined) {
      if (control != null) {
        request.signal.addEventListener('abort', () => {
          control.abort();
        });
      } else {
        console.warn('abort is not supported in this implementation.');
      }
    }
  });
};

export default gmFetch;
