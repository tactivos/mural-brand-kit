/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The editor-app is designed to host both the editing UI and a
  // zero-chrome `/preview/:docId` route that is the target of `File >
  // Print > Save as PDF`. Keep configuration minimal here; build-time
  // integrations (fonts, CMS, etc.) are added in later migration steps
  // only when they're actually needed.
  webpack: (config) => {
    // Allow ESM-style ".js" extensions in imports that actually resolve
    // to TypeScript source files. Without this, Next's webpack fails to
    // resolve `from "./foo.js"` to `./foo.ts`. TypeScript under
    // moduleResolution:Bundler is fine with this either way; we keep
    // the extensions because Node ESM requires them in strict mode.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
