# Third-Party Notices

FBLA One is built on open-source software. The dependency tree is overwhelmingly
permissive (MIT / Apache-2.0 / ISC / BSD). The following non-permissive licenses
are present transitively and are acknowledged here:

- **sharp / libvips native binaries** (`@img/sharp-libvips-*`, `@img/sharp-*`) —
  LGPL-3.0-or-later. Pulled in (optionally) by Next.js for image optimization.
  The libvips binaries are dynamically loaded native artifacts (the LGPL's
  intended use); they do not impose copyleft on this application's code.
  Source: https://github.com/libvips/libvips
- **axe-core** — MPL-2.0. Development/testing only (via `eslint-plugin-jsx-a11y`);
  never shipped to users. Source: https://github.com/dequelabs/axe-core
- **caniuse-lite** — CC-BY-4.0. Browser-support data (via browserslist).
  Source: https://github.com/browserslist/caniuse-lite

All other dependencies are MIT, Apache-2.0, ISC, or BSD-family licenses. There are
no GPL/AGPL/SSPL packages and no unlicensed packages in the tree.

To eliminate the LGPL libvips binaries entirely you may set
`images: { unoptimized: true }` in `next.config.ts` (trades off next/image
optimization performance).
