/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The editor-app is designed to host both the editing UI and a
  // zero-chrome `/preview/:docId` route that is the target of `File >
  // Print > Save as PDF`. Keep configuration minimal here; build-time
  // integrations (fonts, CMS, etc.) are added in later migration steps
  // only when they're actually needed.
};

export default nextConfig;
