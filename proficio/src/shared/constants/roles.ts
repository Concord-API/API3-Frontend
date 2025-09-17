export const ROLES = {
  FUNCIONARIO: 'FUNCIONARIO',
  GESTOR: 'GESTOR',
  DIRETOR: 'DIRETOR',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABEL: Record<UserRole, string> = {
  FUNCIONARIO: 'Funcionário',
  GESTOR: 'Gestor',
  DIRETOR: 'Diretor',
}