import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/econext-schedule-card.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    typescript(),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
};
