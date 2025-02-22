# Developing

## Build & Pack

```sh
# Install dependencies
npm install

# Generate the codes
npm run build

# Pack
npm pack
```

## Linting

Husky and lint-staged will fix the issues before commit.
Please make sure that your code is formatted/linted with prettier/eslint before commit.

```sh
# Check
npm run lint

# Fix
npm run fix
```

## Resources

- GreaseMonkey
  - [API document of GM.xmlHttpRequest](https://wiki.greasespot.net/GM.xmlHttpRequest)
  - [The API code](https://github.com/greasemonkey/greasemonkey/blob/efd22a93121225ada47f2fe9f021af0ab6100c21/src/bg/api-provider-source.js#L252).
  - [The background code](https://github.com/greasemonkey/greasemonkey/blob/efd22a93121225ada47f2fe9f021af0ab6100c21/src/bg/on-user-script-xhr.js#L23).
- Tampermonkey (<= 2.9)
  - NOTE: This is the very old version of Tampermonkey.
  - [API document of GM_xmlhttpRequest](https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest)
  - [The background code](https://github.com/Tampermonkey/tampermonkey/blob/07f668cd1cabb2939220045839dec4d95d2db0c8/src/xmlhttprequest.js)
- Violentmonkey
  - [API document of GM_xmlhttpRequest](https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest)
- MDN
  - [Window: fetch() method - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)
- Fetch Standard
  - [Specification](https://fetch.spec.whatwg.org/#fetch-method)

## Implementation memo

### How [forbidden request headers](https://fetch.spec.whatwg.org/#forbidden-request-header) is treated

- Greasemonkey
  - `Cookie`, `Origin` and `Referer` will be [prefixed with `"x-greasemonkey-"`](https://github.com/greasemonkey/greasemonkey/blob/decb21f52d2cc031e138347063ebbcd0154d0c35/src/bg/on-user-script-xhr.js#L116-L118).
  - They are replaced with the header with the original name before [sending headers](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders). The process is [here](https://github.com/greasemonkey/greasemonkey/blob/a86adcaf78e565ba29bc045eb54c84a9ca1bb88c/src/bg/on-user-script-xhr.js#L180).
- The old version of Tampermonkey (at least 2.9)
  - `User-Agent` and `Referer` will be [prefixed](https://github.com/Tampermonkey/tampermonkey/blob/07f668cd1cabb2939220045839dec4d95d2db0c8/src/xmlhttprequest.js#L123) with [`"TM_"`](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_webRequest).
  - They are replaced with the header with the original name before sending headers. The process is [here](https://github.com/Tampermonkey/tampermonkey/blob/07f668cd1cabb2939220045839dec4d95d2db0c8/src/background.js#L6068C35-L6068C54).
