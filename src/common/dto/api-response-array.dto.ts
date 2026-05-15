import { ApiProperty } from '@nestjs/swagger';

type Constructor<T = object> = new (...args: any[]) => T;

export function ApiResponseArrayDto<T extends Constructor>(DataClass: T) {
  class ApiResponseDtoClass {
    @ApiProperty({ type: [DataClass] })
    data: InstanceType<T>[];
  }

  Object.defineProperty(ApiResponseDtoClass, 'name', {
    value: `ApiResponseArray${DataClass.name}`,
  });

  return ApiResponseDtoClass;
}
