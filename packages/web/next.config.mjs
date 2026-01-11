/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		domains: [],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		formats: ["image/webp"],
	},
	transpilePackages: ["core-web"],
	async redirects() {
		return [
			{
				source: "/dashboard/downloads",
				destination: "/dashboard/download",
				permanent: true,
			},
		];
	},
};

export default nextConfig;
