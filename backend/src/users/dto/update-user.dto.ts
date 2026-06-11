import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false, description: 'Email address of the user' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @ApiProperty({ example: 'password123', required: false, description: 'Password (min 6 characters)' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({ enum: Role, example: 'USER', required: false, description: 'Role of the user (USER, ADMIN)' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'org-uuid-1234', required: false, description: 'Organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
