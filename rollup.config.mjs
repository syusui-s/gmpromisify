import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import banner from 'rollup-plugin-banner';

const bannerTemplate = `gmpromisify v<%= pkg.version %> by <%= pkg.author %>

   Copyright 2022 <%= pkg.author %>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.`;

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      declaration: true,
      rootDir: 'src',
      declarationDir: 'types',
    }),
  ],
  output: [
    {
      file: 'build/index.js',
      format: 'cjs',
    },
    {
      file: 'build/index.esm.js',
      format: 'esm',
    },
    {
      file: 'build/index.iife.js',
      format: 'iife',
      name: 'gmPromisify',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      plugins: [banner.default(bannerTemplate)],
    },
    {
      file: 'build/index.iife.min.js',
      format: 'iife',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      plugins: [terser(), banner.default(bannerTemplate)],
      name: 'gmPromisify',
    },
  ],
};
