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
const arrayBufferToString = (b: ArrayBufferLike): string => {
  const view = new Uint8Array(b);
  const batch = 1024;
  const result = [];
  for (let i = 0; i < view.length; i += batch) {
    const str = String.fromCharCode(...view.subarray(i, i + batch));
    result.push(str);
  }

  return result.join('');
};

export default arrayBufferToString;
