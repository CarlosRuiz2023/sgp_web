export interface RolResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    roles: Roles;
}

export interface Roles {
    count: number;
    rows:  Row[];
}

export interface Row {
    id_rol:  number;
    rol:     string;
    estatus: number;
}
