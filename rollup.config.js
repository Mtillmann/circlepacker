import terser from '@rollup/plugin-terser'
import url from '@rollup/plugin-url'

const config = {
  input: 'dist/index.js',
  output: {
    file: 'dist/index.umd.js',
    format: 'umd',
    name: 'MTCP',
    exports: 'named',
  }
}

const configs = [structuredClone(config), structuredClone(config), {
  input: 'dist/index.js',
  output: {
    file: 'dist/index.min.js',
    format: 'esm'
  },
  plugins: [url({
    include: ['**/*.ts'], // Handles your worker file
    limit: 0, // Forces the worker to be emitted as a separate file
  }), terser()]
}]

configs[1].output.file = 'dist/index.umd.min.js'
configs[1].plugins = [url({
  include: ['**/*.ts'], // Handles your worker file
  limit: 0, // Forces the worker to be emitted as a separate file
}), terser()]

export default configs
