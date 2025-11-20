export interface FirmaResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    firmas:       Firma[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Firma {
    id_firma:       number;
    id_obra:        number;
    id_usuario:     number;
    plano:          null | string;
    fecha_de_firma: Date | null;
    estatus:        number;
    firmador:       Firmador;
    obra:           Obra;
}

export interface Firmador {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}

export interface Obra {
    calle: string;
}
