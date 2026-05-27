import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

type GuardRole = string | { name: string };

interface GuardRequestUser {
  roles?: GuardRole[];
}

interface GuardRequest {
  user?: GuardRequestUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<GuardRequest>();

    if (!user || !user.roles) {
      return false;
    }

    // Normalize roles (supports both string[] and Prisma Role[])
    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles.map((role) =>
          typeof role === 'string' ? role : role.name,
        )
      : [];

    // Admin shortcut
    if (userRoles.includes('ADMIN')) {
      return true;
    }

    const hasRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        'You are not allowed to do this action.',
      );
    }

    return true;
  }
}