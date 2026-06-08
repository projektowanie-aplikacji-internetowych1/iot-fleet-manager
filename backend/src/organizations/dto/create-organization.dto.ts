import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'ACME Corp', description: 'The unique name of the organization' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name cannot be empty' })
  name: string;
}
