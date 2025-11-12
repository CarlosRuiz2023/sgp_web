export interface OficioSapalResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    oficios_sapal: OficiosSapal[];
    total:         number;
    totalPaginas:  number;
    paginaActual:  number;
}

export interface OficiosSapal {
    id_oficio_sapal:    number;
    id_usuario:         number;
    id_usuario_sapal:   number;
    id_obra:            number;
    oficio_de_recibido: null | string;
    observaciones:      null | string;
    oficio_de_revision: null | string;
    fecha_de_entrega:   Date;
    estatus:            number;
    usuario:            EmpleadoSapal;
    empleado_sapal:     EmpleadoSapal;
    obra:               Obra;
}

export interface EmpleadoSapal {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}

export interface Obra {
    calle: string;
}
