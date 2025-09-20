export const ROLES = {
  COLABORADOR: 'COLABORADOR',
  GESTOR: 'GESTOR',
  DIRETOR: 'DIRETOR',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABEL: Record<UserRole, string> = {
  COLABORADOR: 'Colaborador',
  GESTOR: 'Gestor',
  DIRETOR: 'Diretor',
}