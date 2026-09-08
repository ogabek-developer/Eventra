import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'ogabek' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username!: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password!: string;

  @ApiProperty({ example: 18 })
  @IsInt()
  @Min(18)
  @Max(90)
  age!: number;

  @ApiPropertyOptional({ example: 'uploads/users/avatar.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;
}
