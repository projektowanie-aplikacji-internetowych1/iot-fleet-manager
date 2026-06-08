import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'The registered email address' })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'The user password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
