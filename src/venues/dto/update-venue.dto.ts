import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateVenueDto {
  @ApiPropertyOptional({ example: 'Registon Concert Hall' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Registon Square 1' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  address?: string;

  @ApiPropertyOptional({ example: 'Samarkand' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  city?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
