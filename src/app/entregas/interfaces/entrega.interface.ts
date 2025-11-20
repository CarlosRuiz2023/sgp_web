export interface EntregasResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    entregas:     Entrega[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Entrega {
    id_entrega:                number;
    id_obra:                   number;
    id_usuario_fisico:         number;
    id_usuario_administrativo: number;
    oficio_fisica:             string;
    oficio_administrativa:     string;
    acta_fisica:               string;
    acta_administrativa:       string;
    fecha_fisica:              Date|null;
    fecha_administrativa:      Date|null;
    estatus:                   number;
    fisico:                    Administrativo;
    administrativo:            Administrativo;
    obra:                      Obra;
}

export interface Administrativo {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}

export interface Obra {
    calle: string;
}
