import { IsString } from 'class-validator';

export class LoginSuccessDto {
  @IsString()
  accessToken: string;
}
