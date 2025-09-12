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

export interface Row {
    id_colonia: number;
    colonia:    string;
    sector:     number;
    subSector:  number;
    estatus:    number;
}
