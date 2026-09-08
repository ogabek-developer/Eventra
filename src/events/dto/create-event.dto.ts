import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateEventDto {
  @ApiProperty({ example: 'Samarkand Music Night' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({ example: 'An evening of live traditional music' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ example: '2026-10-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '18:00' })
  @Matches(TIME_REGEX, { message: 'start_time must be in HH:mm format' })
  start_time!: string;

  @ApiProperty({ example: '21:00' })
  @Matches(TIME_REGEX, { message: 'end_time must be in HH:mm format' })
  end_time!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  venue_id!: number;

  @ApiProperty({ example: 200 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ enum: EventStatus, example: EventStatus.DRAFT })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
