import { Roles, type UserRole } from '@/shared/constants/roles'

export type AuthMockUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export const authUsersMock: AuthMockUser[] = [
  { id: 'u1', name: 'Colaborador', email: 'colaborador@example.com', role: Roles.Colaborador },
  { id: 'u2', name: 'Gestor', email: 'gestor@example.com', role: Roles.Gestor },
  { id: 'u3', name: 'Diretor', email: 'diretor@example.com', role: Roles.Diretor },
]
