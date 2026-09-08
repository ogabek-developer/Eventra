import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  booking_id!: number;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'CARD' })
  @IsOptional()
  @IsString()
  method?: string;
}
