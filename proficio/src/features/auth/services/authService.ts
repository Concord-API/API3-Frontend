import { type UserRole } from '@/shared/constants/roles'
import { api } from '@/shared/lib/api'

export type LoginPayload = { email: string; password: string }
export type LoginResponse = { token: string; user: { id: string; name: string; email: string; role: UserRole } }

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/login', { email: payload.email, password: payload.password })
    return response.data
  },
}


