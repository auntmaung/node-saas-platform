import { IsString, MinLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  // URL-safe slug: letters, numbers, hyphen
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;
}
