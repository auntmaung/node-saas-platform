import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private accessTtlSeconds() {
    return Number(this.config.get('ACCESS_TOKEN_TTL_SECONDS') ?? 900);
  }

  private refreshTtlSeconds() {
    return Number(this.config.get('REFRESH_TOKEN_TTL_SECONDS') ?? 1209600);
  }

  private async signAccessToken(userId: string, email: string) {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.accessTtlSeconds(),
      },
    );
  }

  private async signRefreshToken(userId: string, email: string, jti: string) {
    return this.jwt.signAsync(
      { sub: userId, email, jti, typ: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.refreshTtlSeconds(),
      },
    );
  }

  private refreshExpiryDate() {
    const secs = this.refreshTtlSeconds();
    return new Date(Date.now() + secs * 1000);
  }

  private async issueTokens(userId: string, email: string): Promise<Tokens> {
    const jti = randomUUID();
    const refreshToken = await this.signRefreshToken(userId, email, jti);
    const tokenHash = await argon2.hash(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        jti,
        tokenHash,
        userId,
        expiresAt: this.refreshExpiryDate(),
      },
    });

    const accessToken = await this.signAccessToken(userId, email);
    return { accessToken, refreshToken };
  }

  async register(email: string, password: string, name?: string) {
     

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user, tokens };
  }

  async login(email: string, password: string) {
     
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    // 1) Verify JWT signature & read jti/sub
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload?.typ !== 'refresh' || !payload?.sub || !payload?.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = String(payload.sub);
    const jti = String(payload.jti);

    // 2) Look up stored token by jti (rotation anchor)
    const record = await this.prisma.refreshToken.findUnique({ where: { jti } });
    if (!record || record.userId !== userId) {
      throw new ForbiddenException('Refresh token revoked or not found');
    }
    if (record.revokedAt) {
      throw new ForbiddenException('Refresh token revoked');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      // revoke as hygiene
      await this.prisma.refreshToken.update({ where: { jti }, data: { revokedAt: new Date() } });
      throw new ForbiddenException('Refresh token expired');
    }

    // 3) Compare hash
    const hashOk = await argon2.verify(record.tokenHash, refreshToken);
    if (!hashOk) {
      // possible token theft / tampering => revoke it
      await this.prisma.refreshToken.update({ where: { jti }, data: { revokedAt: new Date() } });
      throw new ForbiddenException('Refresh token invalid');
    }

    // 4) Rotate: revoke old jti, issue new tokens
    await this.prisma.refreshToken.update({ where: { jti }, data: { revokedAt: new Date() } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokens(user.id, user.email);
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async logoutOne(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      // don’t leak details — treat as already logged out
      return { ok: true };
    }

    const jti = payload?.jti ? String(payload.jti) : null;
    if (!jti) return { ok: true };

    await this.prisma.refreshToken.updateMany({
      where: { jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  }
}
