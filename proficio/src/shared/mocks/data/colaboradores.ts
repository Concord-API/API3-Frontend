import type { Setor, Cargo, Equipe, Colaborador, Competencia, ColaboradorCompetencia } from '@/shared/types'

export const setores: Setor[] = [
  { id_setor: 1, nome_setor: 'Tecnologia', desc_setor: 'TI' },
]

export const cargos: Cargo[] = [
  { id_cargo: 1, nome_cargo: 'Desenvolvedor', id_setor: 1, setor: setores[0] },
  { id_cargo: 2, nome_cargo: 'Gestor de Projetos', id_setor: 1, setor: setores[0] },
  { id_cargo: 3, nome_cargo: 'Diretor de Tecnologia', id_setor: 1, setor: setores[0] },
]

export const equipes: Equipe[] = [
  { id_equipe: 1, nome_equipe: 'Plataforma', id_setor: 1, setor: setores[0] },
]

export const competencias: Competencia[] = [
  { id_competencia: 1, nome: 'React', tipo: 'HARD' },
  { id_competencia: 2, nome: 'TypeScript', tipo: 'HARD' },
  { id_competencia: 3, nome: 'Comunicação', tipo: 'SOFT' },
  { id_competencia: 4, nome: 'Liderança', tipo: 'SOFT' },
  { id_competencia: 5, nome: 'Node.js', tipo: 'HARD' },
  { id_competencia: 6, nome: 'SQL', tipo: 'HARD' },
  { id_competencia: 7, nome: 'Gestão de Tempo', tipo: 'SOFT' },
  { id_competencia: 8, nome: 'Resolução de Problemas', tipo: 'SOFT' },
  { id_competencia: 9, nome: 'Docker', tipo: 'HARD' },
  { id_competencia: 10, nome: 'Kubernetes', tipo: 'HARD' },
]

export const colaboradores: Colaborador[] = [
  { id_colaborador: 101, nome: 'Colaborador', sobrenome: 'Exemplo', status_col: true, foto_url: null, updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), id_equipe: 1, id_cargo: 1, equipe: equipes[0], cargo: cargos[0] },
  { id_colaborador: 102, nome: 'Gestor', sobrenome: 'Exemplo', status_col: true, foto_url: null, updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), id_equipe: 1, id_cargo: 2, equipe: equipes[0], cargo: cargos[1] },
  { id_colaborador: 103, nome: 'Diretor', sobrenome: 'Exemplo', status_col: true, foto_url: null, updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), id_equipe: 1, id_cargo: 3, equipe: equipes[0], cargo: cargos[2] },
]

export const colaboradorCompetencias: ColaboradorCompetencia[] = [
  { id: 1001, id_colaborador: 101, id_competencia: 1, proeficiencia: 5, ordem: 1, competencia: competencias[0] },
  { id: 1002, id_colaborador: 101, id_competencia: 2, proeficiencia: 4, ordem: 2, competencia: competencias[1] },
  { id: 1003, id_colaborador: 101, id_competencia: 3, proeficiencia: 4, ordem: 3, competencia: competencias[2] },
  { id: 1004, id_colaborador: 101, id_competencia: 4, proeficiencia: 3, ordem: 4, competencia: competencias[3] },

  { id: 1101, id_colaborador: 102, id_competencia: 3, proeficiencia: 5, ordem: 1, competencia: competencias[2] },
  { id: 1102, id_colaborador: 102, id_competencia: 4, proeficiencia: 4, ordem: 2, competencia: competencias[3] },

  { id: 1201, id_colaborador: 103, id_competencia: 4, proeficiencia: 5, ordem: 1, competencia: competencias[3] },
]

export const emailToColaboradorId: Record<string, number> = {
  'colaborador@example.com': 101,
  'gestor@example.com': 102,
  'diretor@example.com': 103,
}


