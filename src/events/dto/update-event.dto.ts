import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { EventStatus } from '../../common/enums/event-status.enum';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Samarkand Music Night' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: 'An evening of live traditional music' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'start_time must be in HH:mm format' })
  start_time?: string;

  @ApiPropertyOptional({ example: '21:00' })
  @IsOptional()
  @Matches(TIME_REGEX, { message: 'end_time must be in HH:mm format' })
  end_time?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  venue_id?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: EventStatus, example: EventStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
