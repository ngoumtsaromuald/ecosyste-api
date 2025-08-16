import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsLatitude, IsLongitude, Length, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ 
    description: 'Primary address line',
    example: '123 Main Street',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine1?: string;

  @ApiProperty({ 
    description: 'Secondary address line (apartment, suite, etc.)',
    example: 'Apt 4B',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine2?: string;

  @ApiProperty({ 
    description: 'City name',
    example: 'Yaoundé',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiProperty({ 
    description: 'Region or state',
    example: 'Centre',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  region?: string;

  @ApiProperty({ 
    description: 'Postal code',
    example: '00237',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  postalCode?: string;

  @ApiProperty({ 
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'CM',
    default: 'CM' 
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'Country must be a 2-letter ISO code in uppercase' })
  country: string = 'CM';

  @ApiProperty({ 
    description: 'Latitude coordinate',
    example: 3.848,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ 
    description: 'Longitude coordinate',
    example: 11.502,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;
}