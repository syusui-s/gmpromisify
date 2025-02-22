# gmpromisify : Promisified GM functions

gmPromisify is a library which provides [promisified](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) versions of Greasemonkey functions.

These functions are supported:

- `gmFetch` for `GM.xmlHttpRequst`
- `gmDownload` for `GM_download`

## Examples

### Use in `@require`

```javascript
// ==UserScript==
// @name     gmPromisify Example
// @include  http*
// @grant    GM.xmlHttpRequest
// @require  https://cdn.jsdelivr.net/npm/@syusui-s/gmpromisify/dist/index.iife.js
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

It's needed to use some bundler to import this library into your UserScript.

```sh
$ npm install @syusui-s/gmpromisify
```

```javascript
import { gmFetch } from '@syusui-s/gmpromisify';

(async () => {
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

## API

### gmFetch

`gmFetch(resource: RequestInfo, init: RequestInit): Promise<Response>`

`gmFetch` is a wrapper of `GM.xmlHttpRequest` and has almost the same interface as [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/fetch).

#### Arguments compatibility

- [`init`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
  - `method`
    - Supported
  - `body`
    - Supported
  - `headers`
    - Supported
  - `credentials`
    - Supported
    - The default value is `"same-origin"`.
    - Greasemonkey limitation: `gmFetch` will include `Cookie` when the request is same-origin and `credentials` is `"omit"` because of [this](https://github.com/greasemonkey/greasemonkey/blob/master/src/bg/on-user-script-xhr.js#L130). Including cookies for CORS is introduced by [this PR](https://github.com/greasemonkey/greasemonkey/pull/2835).
  - `integrity`
    - Supported [(SHA-256, SHA-384 and SHA-512)](https://w3c.github.io/webappsec-csp/#grammardef-hash-algorithm)
  - `signal`
    - Supported **ONLY IN [Tampermonkey](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_download) and [Violentmonkey](https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest)**.
  - `mode`
    - **IGNORED**
  - `cache`
    - **IGNORED**
  - `redirect`
    - **MUST BE `"follow"` or `undefined`**.
    - `TypeError` will be thrown if the other value is specified.
    - TBD: Tampermonkey [supports it](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_xmlhttpRequest).
  - `keepalive`
    - **IGNORED**
  - `referrer`
    - **IGNORED**
  - `referrerPolicy`
    - **IGNORED**
  - `priority`
    - **IGNORED**

#### Return value compatibility

A Promise of [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).
The promise will be rejected if the error occurred.

- `Response.body`
  - Supported
- `Response.headers`
  - Supported
- `Response.ok`
  - Supported
- `Response.statusText`
  - Supported
- `Response.url`
  - Always `""`
- `Response.redirected`
  - Always `false` even if redirected.
- `Response.type`
  - Always `"default"`

### gmDownload

`gmDownload(url: string, filename: string): Promise<void>`
`gmDownload(detail: DownloadRequestWithSignal): Promise<void>`

`gmDownload` is a thin wrapper of `GM_download`.

**NOTE**: This is supported only by [Tampermonkey](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_download) and [Violentmonkey](https://violentmonkey.github.io/api/gm/#gm_download), and not supported by Greasemonkey. `TypeError` will be thrown if the function is called in Greasemonkey environment.

#### Arguments compatibility

The API is the same as [GM_download](https://www.tampermonkey.net/documentation.php?locale=en#api:GM_download).

- `detail`
  - The event handlers `onload`, `onerror` and `ontimeout` cannot be passed.

Additional parameters:

- `signal`
  - `AbortController` is supported.

#### Return value compatibility

A Promise of `void`. The promise will be rejected if the `onerror` callback or `ontimeout` callback is called.

## LICENSE

Copyright 2022-2025 Shusui Moyatani

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
