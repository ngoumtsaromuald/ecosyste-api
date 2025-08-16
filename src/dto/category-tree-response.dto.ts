import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';

export class CategoryTreeResponseDto extends CategoryResponseDto {
  @ApiProperty({ 
    description: 'Child categories',
    type: [CategoryTreeResponseDto],
    required: false
  })
  children?: CategoryTreeResponseDto[];

  @ApiProperty({ 
    description: 'Parent category information',
    type: CategoryResponseDto,
    required: false
  })
  parent?: CategoryResponseDto;

  @ApiProperty({ 
    description: 'Category counts',
    example: {
      children: 5,
      apiResources: 25
    },
    required: false
  })
  _count?: {
    children: number;
    apiResources: number;
  };
}