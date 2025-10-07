export interface ComiteResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    comites:      Comite[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Comite {
    id_comite:      number;
    id_obra:        number;
    id_usuario:     number;
    sesion:         number;
    tipo:           number;
    punto:          number;
    costo:          number;
    fecha_creacion: Date;
    estatus:        number;
    obra:           Obra;
    usuario:        Usuario;
}

export interface Obra {
    calle: string;
}

export interface Usuario {
    nombres:          string;
    apellido_paterno: string;
    apellido_materno: string;
}
