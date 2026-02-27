/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    basePath: process.env.NODE_ENV === "production" ? "/safe_voyage" : "",
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
