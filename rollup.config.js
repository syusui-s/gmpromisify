import fs from 'node:fs/promises';

import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import banner2 from 'rollup-plugin-banner2';
import dts from 'rollup-plugin-dts';

const bannerTemplate = async () => {
  const packageJson = await fs.readFile('./package.json', 'utf-8');
  /** @type {{ version: string; author: string; }} */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const pkg = JSON.parse(packageJson);

  return `/* gmpromisify v${pkg.version} - https://github.com/syusui-s/gmpromisify/
 *
 *   Copyright 2022-2025  ${pkg.author}
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
`;
};

export default [
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        rootDir: 'src',
        outputToFilesystem: true,
      }),
    ],
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'es',
        plugins: [banner2(bannerTemplate)],
      },
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        plugins: [banner2(bannerTemplate)],
      },
      {
        file: 'dist/index.iife.js',
        format: 'iife',
        name: 'gmPromisify',
        plugins: [banner2(bannerTemplate)],
      },
      {
        file: 'dist/index.iife.min.js',
        format: 'iife',
        name: 'gmPromisify',
        plugins: [terser(), banner2(bannerTemplate)],
      },
    ],
  },
  {
    input: './dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
