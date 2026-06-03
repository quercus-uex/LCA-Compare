import { IsEmail, IsString } from 'class-validator';
import type { LoginDto as LoginShape } from 'common/auth';

export class LoginDto implements LoginShape {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
