export interface Usuario {
    id_usuario: number;
    id_rol: number;
    id_empresa: number;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    correo: string;
    contrasenia: string;
    contrasenia_visible: string;
    token: string;
    estatus: number;
}
