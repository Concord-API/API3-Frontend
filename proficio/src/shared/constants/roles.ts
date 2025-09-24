export const ROLES = {
  COLABORADOR: 'ROLE_COLABORADOR',
  GESTOR: 'ROLE_GESTOR',
  DIRETOR: 'ROLE_DIRETOR',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABEL: Record<UserRole, string> = {
  ROLE_COLABORADOR: 'Colaborador',
  ROLE_GESTOR: 'Gestor',
  ROLE_DIRETOR: 'Diretor',
};