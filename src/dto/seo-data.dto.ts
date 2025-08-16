import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class SeoDataDto {
  @ApiProperty({ 
    description: 'Meta title for SEO (recommended: 10-60 characters)',
    example: 'Best Restaurant in Yaoundé - ROMAPI',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(10, 60, { 
    message: 'Meta title should be between 10 and 60 characters for optimal SEO' 
  })
  metaTitle?: string;

  @ApiProperty({ 
    description: 'Meta description for SEO (recommended: 50-160 characters)',
    example: 'Discover the best restaurant in Yaoundé with authentic local cuisine and excellent service.',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Length(50, 160, { 
    message: 'Meta description should be between 50 and 160 characters for optimal SEO' 
  })
  metaDescription?: string;
}