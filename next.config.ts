import type { NextConfig } from 'next';

const config: NextConfig = {
  // Transpile ESM-only packages for compatibility
  transpilePackages: ['react-markdown', 'remark-gfm'],
};

export default config;
