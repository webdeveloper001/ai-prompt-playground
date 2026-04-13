// Ambient declarations so TypeScript accepts side-effect CSS imports
// (e.g. `import './globals.css'` in app/layout.tsx) when using
// moduleResolution: "bundler" with strict mode.
declare module '*.css';
