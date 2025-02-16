/**
 * Parse response headers string and covert it to Headers object.
 *
 * https://developer.mozilla.org/ja/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
 */
const parseXHRHeaders = (gmHeaders: string | null): Headers => {
  const headers = new Headers();

  if (gmHeaders == null) {
    return headers;
  }

  // These `name` and `value` contains the last value
  let name = '';
  let value = '';
  // According to 2.2 [RFC9112], a recipient may recognize LF(\n) as a line terminator and ignore CR(\r).
  // However, this implementation strictly requires a sequence CRLF('\r\n') for Firefox-styled multi-lined Set-Cookie.
  // Firefox XHR returns multiple Set-Cookie as LF(\n) separated lines.
  gmHeaders.split(/(\r\n)+/).forEach((line) => {
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

    headers.append(name, value);
  });

  return headers;
};

export default parseXHRHeaders;
