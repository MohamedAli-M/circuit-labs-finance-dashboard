/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the JSON data files (read at runtime via fs) into the serverless
  // functions so the /api routes can read them on Vercel.
  outputFileTracingIncludes: {
    "/api/**": ["./data/**/*"],
  },
}
module.exports = nextConfig