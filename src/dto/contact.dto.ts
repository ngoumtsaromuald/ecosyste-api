import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsUrl, Matches, Length } from 'class-validator';

export class ContactDto {
  @ApiProperty({ 
    description: 'Phone number',
    example: '+237123456789',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[1-9][\d\s\-\(\)]{0,20}$/, { 
    message: 'Phone number must be a valid format' 
  })
  phone?: string;

  @ApiProperty({ 
    description: 'Email address',
    example: 'contact@example.com',
    required: false 
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Length(1, 255)
  email?: string;

  @ApiProperty({ 
    description: 'Website URL',
    example: 'https://www.example.com',
    required: false 
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @Length(1, 500)
  website?: string;
}