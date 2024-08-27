const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/worker.js',
  loader: {
    '.html': 'text', // Tell ESBuild to handle HTML files as text
    '.css' : 'text', // Tell ESbuild to handle css file as text
  },
  format: 'esm',
}).catch(() => process.exit(1));