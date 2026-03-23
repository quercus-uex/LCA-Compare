import { ApiProperty } from '@nestjs/swagger';
import { mixin } from '@nestjs/common';

type Constructor<T = object> = new (...args: any[]) => T;

export function ApiResponseDto<T extends Constructor>(DataClass: T) {
  class ApiResponseDtoClass {
    @ApiProperty({ type: () => DataClass })
    data: InstanceType<T>;
  }

  return mixin(ApiResponseDtoClass);
}
