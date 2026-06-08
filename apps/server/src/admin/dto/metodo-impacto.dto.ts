import { ApiProperty } from '@nestjs/swagger';

export class MetodoImpactoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;
}
