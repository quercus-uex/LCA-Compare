import { IsInt, IsString } from 'class-validator';

export class ApiErrorDto {
  @IsString()
  message: string;

  @IsString()
  error: string;

  @IsInt()
  statusCode: number;
}
