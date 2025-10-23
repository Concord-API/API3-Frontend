export const Roles = {
  Colaborador: 'Colaborador',
  Gestor: 'Gestor',
  Diretor: 'Diretor',
} as const;

export type UserRole = typeof Roles[keyof typeof Roles]

export const ROLE_LABEL: Record<UserRole, string> = {
  Colaborador: 'Colaborador',
  Gestor: 'Gestor',
  Diretor: 'Diretor',
};