import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsBoolean, Matches, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BusinessHourDto {
  @ApiProperty({ 
    description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6 
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ 
    description: 'Opening time in HH:MM format',
    example: '08:00',
    required: false 
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Open time must be in HH:MM format' 
  })
  openTime?: string;

  @ApiProperty({ 
    description: 'Closing time in HH:MM format',
    example: '18:00',
    required: false 
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Close time must be in HH:MM format' 
  })
  closeTime?: string;

  @ApiProperty({ 
    description: 'Whether the business is closed on this day',
    example: false,
    default: false 
  })
  @IsBoolean()
  isClosed: boolean = false;
}