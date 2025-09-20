//import { api } from '@/shared/services/api'
import { ROLES, type UserRole } from '@/shared/constants/roles'

export type LoginPayload = { email: string; password: string }
export type LoginResponse = { token: string; user: { id: string; name: string; email: string; role: UserRole } }

export const authService = {
  async login(_payload: LoginPayload): Promise<LoginResponse> {
    // const response = await api.post<LoginResponse>('/auth/login', _payload)

    // Mock com 3 usuários para teste
    const users = [
      { id: 'u1', name: 'Colaborador', email: 'colaborador@example.com', role: ROLES.COLABORADOR },
      { id: 'u2', name: 'Gestor', email: 'gestor@example.com', role: ROLES.GESTOR },
      { id: 'u3', name: 'Diretor', email: 'diretor@example.com', role: ROLES.DIRETOR },
    ] as const

    const found = users.find((u) => u.email.toLowerCase() === _payload.email.toLowerCase())
    const user = found ?? { id: 'u1', name: 'Colaborador', email: _payload.email, role: ROLES.COLABORADOR }

    return {
      token: `fake-token-${Date.now()}`,
      user,
    }
  },
}


