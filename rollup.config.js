import terser from '@rollup/plugin-terser'

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
  plugins: [terser()]
}]

configs[1].output.file = 'dist/index.umd.min.js'
configs[1].plugins = [terser()]

export default configs
