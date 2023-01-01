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


## LICENSE

   Copyright 2022, 2023 Shusui Moyatani

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
