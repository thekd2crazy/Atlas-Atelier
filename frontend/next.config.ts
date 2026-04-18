import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  
  // ✅ Autorise ton backend IP
  allowedDevOrigins: [
    '192.168.1.34',
    'http://192.168.1.34:3000',
    'http://localhost:3000'
  ],

 
}

export default nextConfig