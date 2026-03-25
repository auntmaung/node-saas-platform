import { IsString } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  token!: string;
}
