export interface EmpresaResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    empresas: Empresas;
}

export interface Empresas {
    count: number;
    rows:  Row[];
}

export interface Row {
    id_empresa: number;
    empresa:    string;
    estatus:    number;
}
