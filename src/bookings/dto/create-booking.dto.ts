import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  event_id!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  seat_id!: number;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  total_amount!: number;
}
