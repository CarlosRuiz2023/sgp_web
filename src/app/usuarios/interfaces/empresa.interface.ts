export interface ColoniasResponse {
    success: boolean;
    data:    Data;
}

export interface Data {
    colonias: Colonias;
}

export interface Colonias {
    count: number;
    rows:  Row[];
}
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

export interface Row {
    id_colonia: number;
    colonia:    string;
    sector:     number;
    subSector:  number;
    estatus:    number;
}
