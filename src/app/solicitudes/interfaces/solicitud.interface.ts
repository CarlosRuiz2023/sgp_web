export interface SolicitudResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    solicitudes:  Solicitud[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Solicitud {
    id_solicitud:           number;
    id_obra:                number;
    id_usuario_solicitud:   number;
    id_usuario_laboratorio: number;
    id_usuario_ms:          number;
    solicitud:              string | null;
    laboratorio:            string | null;
    mecanica_de_suelos:     string | null;
    fecha_solicitud:        Date;
    fecha_laboratorio:      Date | null;
    fecha_ms:               Date | null;
    estatus:                number;
    solicitante:            Laboratorista;
    laboratorista:          Laboratorista;
    mecanico_de_suelos:     Laboratorista;
    obra:                   Obra;
}

export interface Laboratorista {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}

export interface Obra {
    calle: string;
}
