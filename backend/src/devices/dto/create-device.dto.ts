import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuthProtocol, PrivacyProtocol } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Drone Alpha', description: 'Name of the device' })
  @IsString()
  @IsNotEmpty({ message: 'Device name cannot be empty' })
  name: string;

  @ApiProperty({ example: 'mock-device-1', description: 'IP address or Docker hostname of the device' })
  @IsString()
  @IsNotEmpty({ message: 'IP address or hostname is required' })
  ipAddress: string;

  @ApiProperty({ example: 161, description: 'SNMP UDP port', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiProperty({ enum: AuthProtocol, example: 'SHA', required: false, description: 'SNMPv3 Auth Protocol (NONE, MD5, SHA)' })
  @IsOptional()
  @IsEnum(AuthProtocol)
  authProtocol?: AuthProtocol;

  @ApiProperty({ example: 'authPassword123', required: false, description: 'SNMPv3 Auth passphrase' })
  @IsOptional()
  @IsString()
  authPasswordHash?: string;

  @ApiProperty({ enum: PrivacyProtocol, example: 'AES', required: false, description: 'SNMPv3 Privacy Protocol (NONE, DES, AES)' })
  @IsOptional()
  @IsEnum(PrivacyProtocol)
  privacyProtocol?: PrivacyProtocol;

  @ApiProperty({ example: 'privPassword456', required: false, description: 'SNMPv3 Privacy passphrase' })
  @IsOptional()
  @IsString()
  privacyPasswordHash?: string;

  @ApiProperty({ example: 'bootstrapUser', required: false, description: 'SNMPv3 security username' })
  @IsOptional()
  @IsString()
  snmpUsername?: string;

  @ApiProperty({ example: 'org-uuid-1234', required: false, description: 'Organization ID. Required for Admin users, automatically set for regular users.' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
