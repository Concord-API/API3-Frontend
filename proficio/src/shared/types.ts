export type CompetenciaTipo = "SOFT" | "HARD";

export interface Setor {
    id_setor: number;
    nome_setor: string;
    desc_setor?: string | null;
}

export interface Cargo {
    id_cargo: number;
    nome_cargo: string;
    desc_cargo?: string | null;
    id_setor: number;
    setor?: Setor;
}

export interface Equipe {
    id_equipe: number;
    nome_equipe: string;
    gerente?: string | null;
    id_setor: number;
    setor?: Setor;
}

export interface Colaborador {
    id_colaborador: number;
    cpf?: string | null;
    data_nasci?: string | null;
    nome: string;
    sobrenome: string;
    status_col: boolean;
    foto_url?: string | null;
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
