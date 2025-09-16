//import { api } from '@/shared/services/api'

export type LoginPayload = { email: string; password: string }
export type LoginResponse = { token: string; user: { id: string; name: string; email: string } }

export const authService = {
  async login(_payload: LoginPayload): Promise<LoginResponse> {
    // const response = await api.post<LoginResponse>('/auth/login', _payload)
    return {
      token: `fake-token-${Date.now()}`,
      user: { id: '1', name: 'Usuário', email: _payload.email },
    }
  },
}


