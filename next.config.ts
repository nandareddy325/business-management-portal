import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/industries/interior-design',
        permanent: false,
      },
    ]
  },
}

export default nextConfig