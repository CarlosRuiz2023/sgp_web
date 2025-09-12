export interface ObrasResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    obras:        Obra[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Obra {
    id_obra:    number;
    id_colonia: number;
    calle:      string;
    traza_du:   string;
    tramo:      string;
    finiquito:  number;
    estatus:    number;
    createdAt:  Date;
    updatedAt:  Date;
    colonia:    Colonia;
}

export interface Colonia {
    colonia: string;
}
