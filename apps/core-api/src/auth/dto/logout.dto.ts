import { IsOptional, IsString, MinLength } from 'class-validator';

export class LogoutDto {
  // If provided: revoke only that token; if omitted: revoke all for user
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}
