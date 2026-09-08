import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SeatType } from '../../common/enums/seat-type.enum';

export class UpdateSeatDto {
  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  row?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;

  @ApiPropertyOptional({ enum: SeatType, example: SeatType.VIP })
  @IsOptional()
  @IsEnum(SeatType)
  type?: SeatType;
}
