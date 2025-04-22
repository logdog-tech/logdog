import { config } from './config'
import type { 
    Workspace,
    Rule,
    User
} from '../modules/base'
// 统一的请求配置
const defaultConfig = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  } as Record<string, string>
} 

if (config.DEBUG) {
      defaultConfig.headers['Authorization'] = `Bearer ${config.DEBUG_TOKEN}`
}

// 用户相关的 API
export const userApi = {
  // 获取用户信息
  async getUserInfo(): Promise<User> {
    const response = await fetch(`${config.API_BASE_URL}/api/user/info`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('Failed to get user info')
    return response.json()
  },

  // 获取登录二维码
  async getLoginQRCode() {
    const response = await fetch(`${config.API_BASE_URL}/api/login/qrcode`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('Failed to get QR code')
    return response.json()
  },

  // 检查登录状态
  async checkLoginState(state: string) {
    const response = await fetch(`${config.API_BASE_URL}/api/login/check_state/${state}`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('Failed to check login state')
    return response.json()
  },

  async logout() {
    const response = await fetch(`${config.API_BASE_URL}/api/logout`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('Failed to logout')
    return response.json()
  }
}

// 通用的响应处理函数
async function handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    if (!response.ok) {
        throw data;
    }
    return data;
}

// 修改 workspaceApi 的类型定义
export const workspaceApi = {
  async createWorkspace(workspace: {
    workspace_name: string,
    workspace_desc?: string,
    is_public: boolean,
    uuid: string
  }): Promise<Workspace> {
    const response = await fetch(`${config.API_BASE_URL}/api/workspaces`, {
      ...defaultConfig,
      method: 'POST',
      body: JSON.stringify(workspace)
    } as RequestInit)
    if (!response.ok) throw new Error('创建工作空间失败')
    return response.json()
  },

  async getWorkspace(id: number): Promise<Workspace> {
    const response = await fetch(`${config.API_BASE_URL}/api/workspaces/${id}`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('获取工作空间失败')
    return response.json()
  },

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${config.API_BASE_URL}/api/workspaces`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('获取工作空间列表失败')
    return response.json()
  },

  async updateWorkspace(id: number, workspace: {
    workspace_name: string,
    workspace_desc?: string,
    is_public: boolean
  }): Promise<Workspace> {
    const response = await fetch(`${config.API_BASE_URL}/api/workspaces/${id}`, {
      ...defaultConfig,
      method: 'PUT',
      body: JSON.stringify(workspace)
    } as RequestInit)
    if (!response.ok) throw new Error('更新工作空间失败')
    return response.json()
  },

  async deleteWorkspace(id: number): Promise<{ message: string }> {
    const response = await fetch(`${config.API_BASE_URL}/api/workspaces/${id}`, {
      ...defaultConfig,
      method: 'DELETE'
    } as RequestInit)
    if (!response.ok) throw new Error('删除工作空间失败')
    return response.json()
  },

  async addWorkspaceMember(
    workspaceId: number, 
    userId: number, 
    role: string = 'member'
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${config.API_BASE_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
        ...defaultConfig,
        method: 'POST',
        body: JSON.stringify({ role })
      } as RequestInit
    )
    return handleResponse(response)
  },

  async removeWorkspaceMember(
    workspaceId: number,
    userId: number
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${config.API_BASE_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
        ...defaultConfig,
        method: 'DELETE'
      } as RequestInit
    )
    if (!response.ok) throw new Error('移除成员失败')
    return response.json()
  },

  async searchUsers(
    workspaceId: number,
    query: string
  ): Promise<Array<{
    id: number;
    nickname: string;
    email: string;
    avatar?: string;
  }>> {
    const response = await fetch(
      `${config.API_BASE_URL}/api/workspaces/${workspaceId}/search_users?query=${encodeURIComponent(query)}`,
      {
        ...defaultConfig,
        method: 'GET'
      } as RequestInit
    )
    if (!response.ok) throw new Error('搜索用户失败')
    return response.json()
  },

  async createInvitation(workspaceId: number): Promise<{
    code: string;
    expired_at: string;
    url: string;
  }> {
    const response = await fetch(
      `${config.API_BASE_URL}/api/workspaces/${workspaceId}/invitation`,
      {
        ...defaultConfig,
        method: 'POST'
      } as RequestInit
    )
    if (!response.ok) throw new Error('创建邀请链接失败')
    return response.json()
  },

  async joinWorkspaceByInvitation(code: string): Promise<{ message: string }> {
    const response = await fetch(
      `${config.API_BASE_URL}/api/workspaces/join/${code}`,
      {
        ...defaultConfig,
        method: 'POST'
      } as RequestInit
    );
    return handleResponse(response);
  }
}

// 修改 ruleApi 的类型定义
export const ruleApi = {
  async createRule(rule: Rule): Promise<Rule> {
    const response = await fetch(`${config.API_BASE_URL}/api/rules`, {
      ...defaultConfig,
      method: 'POST',
      body: JSON.stringify(rule)
    } as RequestInit)
    if (!response.ok) throw new Error('创建规则失败')
    return response.json()
  },

  async getRule(id: number): Promise<Rule> {
    const response = await fetch(`${config.API_BASE_URL}/api/rules/${id}`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('获取规则失败')
    return response.json()
  },

  async getRules(params?: {
    workspace_id?: number,
    rule_type?: string,
    tags?: string
  }): Promise<Rule[]> {
    const queryParams = new URLSearchParams()
    if (params) {
      if (params.workspace_id) queryParams.append('workspace_id', params.workspace_id.toString())
      if (params.rule_type) queryParams.append('rule_type', params.rule_type)
      if (params.tags) queryParams.append('tags', params.tags)
    }
    
    const url = `${config.API_BASE_URL}/api/rules${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('获取规则列表失败')
    return response.json()
  },

  async updateRule(rule: Rule): Promise<Rule> {
    const response = await fetch(`${config.API_BASE_URL}/api/rules/${rule.uuid}`, {
      ...defaultConfig,
      method: 'PUT',
      body: JSON.stringify(rule)
    } as RequestInit)
    if (!response.ok) throw new Error('更新规则失败')
    return response.json()
  },

  async deleteRule(uuid: string): Promise<{ message: string }> {
    const response = await fetch(`${config.API_BASE_URL}/api/rules/${uuid}`, {
      ...defaultConfig,
      method: 'DELETE'
    } as RequestInit)
    if (!response.ok) throw new Error('删除规则失败')
    return response.json()
  },

  async favoriteRule(id: number): Promise<{ message: string }> {
    const response = await fetch(`${config.API_BASE_URL}/api/rules/${id}/favorite`, {
      ...defaultConfig,
      method: 'POST'
    } as RequestInit)
    if (!response.ok) throw new Error('收藏规则失败')
    return response.json()
  },

  async unfavoriteRule(id: number): Promise<{ message: string }> {
    const response = await fetch(`${config.API_BASE_URL}/api/rules/${id}/favorite`, {
      ...defaultConfig,
      method: 'DELETE'
    } as RequestInit)
    if (!response.ok) throw new Error('取消收藏失败')
    return response.json()
  },

  async getFavorites(): Promise<number[]> {
    const response = await fetch(`${config.API_BASE_URL}/api/favorites`, {
      ...defaultConfig,
      method: 'GET'
    } as RequestInit)
    if (!response.ok) throw new Error('获取收藏列表失败')
    return response.json()
  }
}

// 统一的错误处理
export const handleApiError = (error: Error) => {
  if (config?.DEBUG) {
    console.error(`[${config.currentEnv}] API Error:`, error)
    console.debug('Development mode: Detailed error info', error)
  } else {
    console.error('API Error:', error)
  }
}

// 导出当前环境配置，方便其他地方使用
export { config }
