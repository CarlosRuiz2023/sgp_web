export interface EstimacionResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    estimaciones: Estimacion[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Estimacion {
    id_estimacion:     number;
    id_usuario:        number;
    id_obra:           number;
    estimacion:        null | string;
    finiquito:         boolean;
    avance_fisico:     number;
    avance_financiero: number;
    actual:            number;
    anterior:          number;
    fecha_creacion:    Date;
    estatus:           number;
    usuario:           Usuario;
    obra:              Obra;
}

export interface Obra {
    calle: string;
}

export interface Usuario {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}
