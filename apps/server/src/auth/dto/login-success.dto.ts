import { IsString } from 'class-validator';
import type { LoginSuccessDto as LoginSuccessShape } from 'common/auth';

export class LoginSuccessDto implements LoginSuccessShape {
  @IsString()
  accessToken: string;
}
