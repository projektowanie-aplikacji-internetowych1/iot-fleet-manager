import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateDeviceDto, userOrgId: string, isAdmin: boolean) {
    let targetOrgId = userOrgId;
    if (isAdmin && dto.organizationId) {
      targetOrgId = dto.organizationId;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: targetOrgId },
    });
    if (!org) {
      throw new BadRequestException('Target organization does not exist');
    }

    return this.prisma.device.create({
      data: {
        name: dto.name,
        ipAddress: dto.ipAddress,
        port: dto.port ?? 161,
        authProtocol: dto.authProtocol ?? 'NONE',
        authPasswordHash: dto.authPasswordHash || null,
        privacyProtocol: dto.privacyProtocol ?? 'NONE',
        privacyPasswordHash: dto.privacyPasswordHash || null,
        snmpUsername: dto.snmpUsername ?? 'bootstrapUser',
        organizationId: targetOrgId,
      },
    });
  }

  async findAll(organizationId?: string) {
    return this.prisma.device.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        organization: {
          select: { name: true },
        },
        metrics: {
          orderBy: { collectedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        organization: true,
        metrics: {
          orderBy: { collectedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  async remove(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return this.prisma.device.delete({
      where: { id },
    });
  }

  async getDeviceMetrics(deviceId: string, limit: number = 50) {
    const metrics = await this.prisma.deviceMetric.findMany({
      where: { deviceId },
      orderBy: { collectedAt: 'desc' },
      take: limit,
    });
    return metrics.reverse();
  }
}
