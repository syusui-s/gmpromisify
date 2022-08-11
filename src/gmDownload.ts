type DownloadRequest = Omit<Tampermonkey.DownloadRequest, 'onload' | 'onerror' | 'ontimeout'> & {
  signal?: AbortSignal;
};

type GMDownloadArgs = [url: string, name: string] | [DownloadRequest];

const buildDetails = (args: GMDownloadArgs): DownloadRequest => {
  if (typeof args[0] === 'string') {
    const url = args[0].toString();
    const name = args[1];

    if (name == null) {
      throw new Error('name is empty.');
    }

    return { url, name };
  }

  return args[0];
};

/**
 * GM_download wrapper.
 */
const gmDownload = (...args: GMDownloadArgs): Promise<void> => {
  if (typeof GM_download === 'undefined') {
    throw new Error('GM_download is not listed in @grant or not supported on this environment.');
  }
  const { signal, ...details } = buildDetails(args);

  if (signal?.aborted) {
    throw new DOMException('The request was aborted.', 'AbortError');
  }

  return new Promise((resolve, reject) => {
    const control = GM_download({
      ...details,
      onload() {
        resolve();
      },
      onerror(err) {
        const errDetails = err.details != null ? `: ${err.details}` : '';
        reject(new TypeError(`DownloadError: ${err.error}${errDetails}`));
      },
      ontimeout() {
        reject(new TypeError('TimeoutError'));
      },
    });

    if (signal != null) {
      signal.addEventListener('abort', () => control.abort());
    }
  });
};

export default gmDownload;
