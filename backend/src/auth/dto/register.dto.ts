import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address of the user' })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (minimum 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'ACME Corporation', description: 'Name of the organization to create or join' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName: string;

  @ApiProperty({ enum: Role, example: 'USER', required: false, description: 'User role (USER or ADMIN)' })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be either USER or ADMIN' })
  role?: Role;
}
