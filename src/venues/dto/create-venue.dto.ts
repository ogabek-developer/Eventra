import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Registon Concert Hall' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Registon Square 1' })
  @IsString()
  @MinLength(2)
  address!: string;

  @ApiProperty({ example: 'Samarkand' })
  @IsString()
  @MinLength(2)
  city!: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  capacity!: number;
}
