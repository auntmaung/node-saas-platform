import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
