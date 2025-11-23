import { Roles } from '@/shared/constants/roles'
import { Gender } from '@/shared/constants/gender'
import type { Setor, Cargo, Equipe, Colaborador, Competencia, ColaboradorCompetencia } from '@/shared/types'

export const setores: Setor[] = [
  { id_setor: 1, nome_setor: 'Tecnologia', desc_setor: 'TI', status: true, id_diretor: 103 },
  { id_setor: 2, nome_setor: 'Financeiro', desc_setor: 'Gestão Financeira e Contábil', status: true, id_diretor: 109 },
  { id_setor: 3, nome_setor: 'Recursos Humanos', desc_setor: 'Gestão de Pessoas e RH', status: true, id_diretor: null },
]

export const cargos: Cargo[] = [
  // Tecnologia
  { id_cargo: 1, nome_cargo: 'Desenvolvedor Banckend Junior', id_setor: 1, status: true, setor: setores[0] },
  { id_cargo: 2, nome_cargo: 'Gestor de Projetos', id_setor: 1, status: true, setor: setores[0] },
  { id_cargo: 3, nome_cargo: 'Diretor de Tecnologia', id_setor: 1, status: true, setor: setores[0] },

  // Financeiro
  { id_cargo: 4, nome_cargo: 'Analista Financeiro', id_setor: 2, status: true, setor: setores[1] },
  { id_cargo: 5, nome_cargo: 'Gestor Financeiro', id_setor: 2, status: true, setor: setores[1] },
  { id_cargo: 6, nome_cargo: 'Diretor Financeiro', id_setor: 2, status: true, setor: setores[1] },

  // Recursos Humanos
  { id_cargo: 7, nome_cargo: 'Analista de RH', id_setor: 3, status: true, setor: setores[2] },
  { id_cargo: 8, nome_cargo: 'Gestor de RH', id_setor: 3, status: true, setor: setores[2] },
  { id_cargo: 9, nome_cargo: 'Diretor de RH', id_setor: 3, status: true, setor: setores[2] },
]

export const equipes: Equipe[] = [
  { id_equipe: 1, nome_equipe: 'Desenvolvimento', id_setor: 1, status: true, setor: setores[0] },
  { id_equipe: 2, nome_equipe: 'Desenvolvimento 2', id_setor: 1, status: true, setor: setores[0] },
  { id_equipe: 3, nome_equipe: 'Gestão Financeira', id_setor: 2, status: true, setor: setores[1] },
  { id_equipe: 4, nome_equipe: 'Gestão de Pessoas', id_setor: 3, status: true, setor: setores[2] },
]

export const competencias: Competencia[] = [
  { id_competencia: 1, nome: 'React', tipo: 0 },
  { id_competencia: 2, nome: 'TypeScript', tipo: 0 },
  { id_competencia: 3, nome: 'Comunicação', tipo: 1 },
  { id_competencia: 4, nome: 'Liderança', tipo: 1 },
  { id_competencia: 5, nome: 'Node.js', tipo: 0 },
  { id_competencia: 6, nome: 'SQL', tipo: 0 },
  { id_competencia: 7, nome: 'Gestão de Tempo', tipo: 1 },
  { id_competencia: 8, nome: 'Resolução de Problemas', tipo: 1 },
  { id_competencia: 9, nome: 'Docker', tipo: 0 },
  { id_competencia: 10, nome: 'Kubernetes', tipo: 0 },
]

export const colaboradores: Colaborador[] = [
  // Tecnologia
  { id_colaborador: 101, nome: 'Tainara', sobrenome: 'Nogueira', email: 'colaborador@example.com', data_nasci: '1997-06-18', senha: '12345678', genero: Gender.Female, status: true, role: Roles.COLABORADOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tainara%20Nogueira', capa: 'https://picsum.photos/seed/101/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3).toISOString(), atualizado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), id_equipe: 1, id_cargo: 1, equipe: equipes[0], cargo: cargos[0] },
  { id_colaborador: 102, nome: 'Adler', sobrenome: 'Alves', email: 'gestor@example.com', data_nasci: '1990-02-11', senha: '12345678', genero: Gender.Male, status: true, role: Roles.GESTOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adler%20Alves', capa: 'https://picsum.photos/seed/102/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 9).toISOString(), atualizado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), id_equipe: 1, id_cargo: 2, equipe: equipes[0], cargo: cargos[1] },
  { id_colaborador: 103, nome: 'Richard', sobrenome: 'Cordeiro', email: 'diretor@example.com', data_nasci: '1987-09-05', senha: '12345678', genero: Gender.Male, status: true, role: Roles.DIRETOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Richard%20Cordeiro', capa: 'https://picsum.photos/seed/103/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 13).toISOString(), atualizado_em: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), id_equipe: 1, id_cargo: 3, equipe: equipes[0], cargo: cargos[2] },
  { id_colaborador: 104, nome: 'João', sobrenome: 'Baranov', email: 'colaborador@example.com', data_nasci: '1999-03-22', senha: '12345678', genero: Gender.Female, status: true, role: Roles.COLABORADOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jo%C3%A3o%20Baranov', capa: 'https://picsum.photos/seed/104/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3).toISOString(), atualizado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), id_equipe: 1, id_cargo: 1, equipe: equipes[0], cargo: cargos[0] },
  { id_colaborador: 105, nome: 'João', sobrenome: 'Andrade', email: 'joao.andrade@example.com', data_nasci: '1989-11-02', senha: '12345678', genero: Gender.Male, status: true, role: Roles.COLABORADOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jo%C3%A3o%20Andrade', capa: 'https://picsum.photos/seed/105/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 9).toISOString(), atualizado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), id_equipe: 1, id_cargo: 1, equipe: equipes[0], cargo: cargos[0] },
  { id_colaborador: 106, nome: 'Victor', sobrenome: 'Nogueira', email: 'colaborador@example.com', data_nasci: '1985-04-14', senha: '12345678', genero: Gender.Male, status: true, role: Roles.COLABORADOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victor%20Nogueira', capa: 'https://picsum.photos/seed/106/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 13).toISOString(), atualizado_em: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), id_equipe: 1, id_cargo: 1, equipe: equipes[0], cargo: cargos[0] },

  // Financeiro
  { id_colaborador: 107, nome: 'Mariana', sobrenome: 'Costa', email: 'analista.financeiro@example.com', data_nasci: '1996-01-29', senha: '12345678', genero: Gender.Female, status: true, role: Roles.COLABORADOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana%20Costa', capa: 'https://picsum.photos/seed/107/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2).toISOString(), atualizado_em: new Date().toISOString(), id_equipe: 2, id_cargo: 4, equipe: equipes[1], cargo: cargos[3] },
  { id_colaborador: 108, nome: 'Lucas', sobrenome: 'Mendes', email: 'gestor.financeiro@example.com', data_nasci: '1991-08-07', senha: '12345678', genero: Gender.Male, status: true, role: Roles.GESTOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas%20Mendes', capa: 'https://picsum.photos/seed/108/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 9).toISOString(), atualizado_em: new Date().toISOString(), id_equipe: 2, id_cargo: 5, equipe: equipes[1], cargo: cargos[4] },
  { id_colaborador: 109, nome: 'Fernanda', sobrenome: 'Silva', email: 'diretor.financeiro@example.com', data_nasci: '1988-12-13', senha: '12345678', genero: Gender.Female, status: true, role: Roles.DIRETOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fernanda%20Silva', capa: 'https://picsum.photos/seed/109/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 13).toISOString(), atualizado_em: new Date().toISOString(), id_equipe: 2, id_cargo: 6, equipe: equipes[1], cargo: cargos[5] },

  // Recursos Humanos
  { id_colaborador: 110, nome: 'Bruno', sobrenome: 'Oliveira', email: 'analista.rh@example.com', data_nasci: '1995-05-26', senha: '12345678', genero: Gender.Male, status: true, role: Roles.COLABORADOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno%20Oliveira', capa: 'https://picsum.photos/seed/110/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3).toISOString(), atualizado_em: new Date().toISOString(), id_equipe: 3, id_cargo: 7, equipe: equipes[2], cargo: cargos[6] },
  { id_colaborador: 111, nome: 'Patrícia', sobrenome: 'Gomes', email: 'gestor.rh@example.com', data_nasci: '1992-04-03', senha: '12345678', genero: Gender.Female, status: true, role: Roles.GESTOR, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patr%C3%ADcia%20Gomes', capa: 'https://picsum.photos/seed/111/1200/300', criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 9).toISOString(), atualizado_em: new Date().toISOString(), id_equipe: 3, id_cargo: 8, equipe: equipes[2], cargo: cargos[7] }
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
  'Gestor@example.com': 102,
  'diretor@example.com': 103,

  'analista.financeiro@example.com': 104,
  'Gestor.financeiro@example.com': 105,
  'diretor.financeiro@example.com': 106,

  'analista.rh@example.com': 107,
  'Gestor.rh@example.com': 108,
  'diretor.rh@example.com': 109,
}
