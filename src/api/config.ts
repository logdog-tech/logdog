// 首先定义环境配置的接口
interface EnvConfig {
  API_BASE_URL: string;
  DOMAIN: string;
  DEBUG?: boolean;
  DEBUG_TOKEN?: string;
}

// 环境配置
const ENV: Record<string, EnvConfig> = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    DOMAIN: import.meta.env.VITE_DOMAIN || 'localhost',
    DEBUG: true,
    DEBUG_TOKEN: import.meta.env.VITE_DEBUG_TOKEN || ''
  },
  staging: {
    API_BASE_URL: 'https://api-staging.logdog.tech',
    DOMAIN: 'staging.logdog.tech'
  },
  production: {
    API_BASE_URL: 'https://api.logdog.tech',
    DOMAIN: 'logdog.tech'
  }
}

// 获取当前环境
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const hostname = window.location.hostname
  if (hostname.includes('staging')) {
    return 'staging'
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  }
  return 'production'
}

// 当前环境的配置
export const currentEnv = getEnvironment()
export const config = {
  ...ENV[currentEnv],
  currentEnv
}
