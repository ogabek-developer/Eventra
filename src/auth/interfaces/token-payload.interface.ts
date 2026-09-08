import { Role } from '../../common/enums/role.enum';

export interface TokenPayload {
  sub: number;
  username: string;
  role: Role;
  is_super: boolean;
}
