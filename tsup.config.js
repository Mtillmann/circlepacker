import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync } from 'fs'
import { minify } from 'terser'

export default defineConfig({
  format: ['esm'],
  entry: {
    index: 'src/index.ts',
    worker: 'src/Worker.ts',
  },
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: true,
  async onSuccess() {
    const content = readFileSync('dist/worker.js', 'utf-8')
    const minified = await minify(content)
    let index = readFileSync('dist/index.js', 'utf-8')
    writeFileSync('dist/index.js', index.replace('%%WORKER_URL', `data:text/javascript;base64,${btoa(minified.code)}`))
  }
})
