import adapter from '@sveltejs/adapter-static';
import path from 'path';
import preprocess from 'svelte-preprocess';

const ci = process.env.CI === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({ postcss: true }),

  kit: {
    vite: {
      resolve: {
        alias: {
          $src: path.resolve('./src'),
          $comps: path.resolve('./src/components')
        }
      }
    },

    adapter: adapter({
      // default options are shown
      pages: 'build',
      assets: 'build',
      fallback: null,
      compress: true
    }),

    prerender: {
      // This can be false if you're using a fallback (i.e. SPA mode)
      default: true,
      crawl: true
    },
    paths: {
      base: ci ? '/libd-rotation' : ''
    }
  }
};

export default config;
