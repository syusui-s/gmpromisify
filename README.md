gmPromisify : Promisified GM functions
===

gmPromisify is a library which provides [promisified](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) versions of Greasemonkey functions.

Currently, these functions are available:

* gmFetch:    `GM.xmlHttpRequst`
* gmDownload: `GM_download`

## Installation

### Use in `@require`

```javascript
// ==UserScript==
// @name     gmPromisify Example
// @include  http*
// @grant    GM.xmlHttpRequest
// @require  https://github.com/syusui-s/gmpromisify/
// ==/UserScript==

(async () => {
  const { gmFetch } = gmPromisify;

  const res = await gmFetch('https://example.com', {
    method: 'GET',
    headers: {
      'X-Custom-Header': 'Custom Value',
    },
  });
  const body = await res.text();
  console.log(body);
})();
```

### Use as npm package

**TBD**

## API

### gmFetch

`gmFetch(resource: RequestInfo, init: RequestInit): Promise<Response>`

`gmFetch` is a wrapper of `GM.xmlHttpRequest` and has same interface as Fetch API.

The usage is basically same as [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/fetch).

There are some unsupported features. Please refer `src/gmFetch.ts` for more details.

### gmDownload

`gmDownload(...args: GMDownloadArgs): Promise<void>`

`gmDownload` is a wrapper of `GM_download`.
Note: This is supported by only Tampermonkey and Violentmonkey. It is not supported by Greasemonkey.

AbortController is additionally supported. Please refer `src/gmDownload.ts` for more details.

## Build

```
npm run build
```
