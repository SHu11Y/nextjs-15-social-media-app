/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('argon2');
      config.externals.push('@node-rs/argon2');
    }
    // Prevent stream-chat from being bundled on client side
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'stream-chat': false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/*`,
      },
    ],
  },
  rewrites: () => {
    return [
      {
        source: "/hashtag/:tag",
        destination: "/search?q=%23:tag",
      },
    ];
  },
};

export default nextConfig;