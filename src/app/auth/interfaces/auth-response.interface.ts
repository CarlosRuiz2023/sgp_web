import { Usuario } from "./user.interface";

export interface AuthResponse {
    success: boolean;
    data:    Usuario;
}
