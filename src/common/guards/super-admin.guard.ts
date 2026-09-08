import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TokenPayload } from '../../auth/interfaces/token-payload.interface';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: TokenPayload = request.user;

    if (!user || !user.is_super) {
      throw new ForbiddenException('Only Super Admin can perform this action');
    }

    return true;
  }
}
