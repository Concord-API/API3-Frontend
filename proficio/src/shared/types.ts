import type { UserRole } from "./constants/roles";

export type CompetenciaTipo = 0 | 1;

export interface Setor {
    id_setor: number;
    nome_setor: string;
    desc_setor?: string | null;
    status: boolean;
    // diretor responsável (opcional)
    id_diretor?: number | null;
    diretor?: Colaborador | null;
}

export interface Cargo {
    id_cargo: number;
    nome_cargo: string;
    desc_cargo?: string | null;
    role?: UserRole;
    id_setor: number;
    setor?: Setor;
    status: boolean;
}

export interface Equipe {
    id_equipe: number;
    nome_equipe: string;
    gerente?: string | null;
    id_setor: number;
    setor?: Setor;
    status: boolean;
}

export interface Squad {
    id: number;
    nome: string;
    descricao?: string | null;
    status: boolean;
    membrosCount?: number;
    liderId?: number | null;
}

export interface Colaborador {
    id_colaborador: number;
    cpf?: string | null;
    data_nasci?: string | null;
    nome: string;
    sobrenome: string;
    genero: boolean;
    email: string;
    senha: string;
    status: boolean;
    role?: UserRole;
    avatar?: string | null;
    capa?: string | null;
    criado_em?: string | null;
    atualizado_em?: string | null;
    id_equipe: number;
    id_cargo: number;
    equipe?: Equipe;
    cargo?: Cargo;
    competencias?: ColaboradorCompetencia[];
}

export interface Competencia {
    id_competencia: number;
    nome: string;
    tipo: CompetenciaTipo;
    aprovada?: boolean;
}

export interface ColaboradorCompetencia {
    id: number;
    id_colaborador: number;
    id_competencia: number;
    proeficiencia: number;
    ordem?: number | null;
    colaborador?: Colaborador;
    competencia?: Competencia;
}
