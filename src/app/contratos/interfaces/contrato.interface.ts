export interface ContratosResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    contratos:    Contrato[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Contrato {
    id_contrato:            number;
    id_usuario:             number;
    id_usuario_contratista: number;
    id_usuario_supervisor:  number;
    id_obra:                number;
    costo_real:             number;
    fecha_inicio:           Date;
    fecha_termino:          Date;
    estatus:                number;
    usuario:                Contratista;
    supervisor:             Contratista;
    contratista:            Contratista;
    obra:                   Obra;
}

export interface Contratista {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}

export interface Obra {
    calle: string;
}
