import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SeatType } from '../../common/enums/seat-type.enum';

export class CreateSeatDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  venue_id!: number;

  @ApiProperty({ example: 'A' })
  @IsString()
  row!: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  number!: number;

  @ApiPropertyOptional({ enum: SeatType, example: SeatType.REGULAR })
  @IsOptional()
  @IsEnum(SeatType)
  type?: SeatType;
}
