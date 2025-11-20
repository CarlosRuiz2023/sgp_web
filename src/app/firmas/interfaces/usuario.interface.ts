export interface UsuariosResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    usuarios:     Usuario[];
    total:        number;
    totalPaginas: number;
    paginaActual: number;
}

export interface Usuario {
    id_usuario:          number;
    id_rol:              number;
    id_empresa:          number;
    nombres:             string;
    apellido_paterno:    string;
    apellido_materno:    string;
    correo:              string;
    contrasenia:         string;
    contrasenia_visible: string;
    token:               null | string;
    estatus:             number;
    rol:                 Rol;
    empresa:             Empresa;
}

export interface Empresa {
    empresa: string;
}

export interface Rol {
    rol: string;
}
