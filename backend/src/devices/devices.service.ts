import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { SnmpService } from '../snmp/snmp.service';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private snmpService: SnmpService,
  ) { }

  async create(dto: CreateDeviceDto, userOrgId: string, isAdmin: boolean) {
    let targetOrgId = userOrgId;
    if (isAdmin && dto.organizationId) {
      targetOrgId = dto.organizationId;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: targetOrgId },
    });
    if (!org) {
      throw new BadRequestException('Docelowa organizacja nie istnieje');
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
      throw new NotFoundException(`Urządzenie o identyfikatorze ${id} nie zostało znalezione`);
    }

    return device;
  }

  async remove(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });
    if (!device) {
      throw new NotFoundException(`Urządzenie o identyfikatorze ${id} nie zostało znalezione`);
    }

    return this.prisma.device.delete({
      where: { id },
    });
  }

  async update(id: string, dto: CreateDeviceDto, userOrgId: string, isAdmin: boolean) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });
    if (!device) {
      throw new NotFoundException(`Urządzenie o identyfikatorze ${id} nie zostało znalezione`);
    }

    let targetOrgId = device.organizationId;
    if (isAdmin && dto.organizationId) {
      targetOrgId = dto.organizationId;
      const org = await this.prisma.organization.findUnique({
        where: { id: targetOrgId },
      });
      if (!org) {
        throw new BadRequestException('Docelowa organizacja nie istnieje');
      }
    }

    return this.prisma.device.update({
      where: { id },
      data: {
        name: dto.name,
        ipAddress: dto.ipAddress,
        port: dto.port ?? 161,
        authProtocol: dto.authProtocol ?? 'NONE',
        authPasswordHash: dto.authPasswordHash !== undefined ? dto.authPasswordHash : undefined,
        privacyProtocol: dto.privacyProtocol ?? 'NONE',
        privacyPasswordHash: dto.privacyPasswordHash !== undefined ? dto.privacyPasswordHash : undefined,
        snmpUsername: dto.snmpUsername ?? 'bootstrapUser',
        organizationId: targetOrgId,
      },
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

  async pollDeviceOnDemand(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });
    if (!device) {
      throw new NotFoundException(`Urządzenie o identyfikatorze ${id} nie zostało znalezione`);
    }

    try {
      const metrics = await this.snmpService.pollDevice(device);
      return await this.prisma.deviceMetric.create({
        data: {
          deviceId: device.id,
          battery: metrics.battery,
          uptime: metrics.uptime,
          status: metrics.status,
          temperature: metrics.temperature,
          signalStrength: metrics.signalStrength,
          memoryUsage: metrics.memoryUsage,
        },
      });
    } catch (error: any) {
      return await this.prisma.deviceMetric.create({
        data: {
          deviceId: device.id,
          battery: 0,
          uptime: 0,
          status: 'OFFLINE',
          temperature: 0,
          signalStrength: -100,
          memoryUsage: 0,
        },
      });
    }
  }

  async pollAllDevicesOnDemand(organizationId?: string) {
    const devices = await this.prisma.device.findMany({
      where: organizationId ? { organizationId } : {},
    });

    const pollPromises = devices.map(async (device) => {
      try {
        const metrics = await this.snmpService.pollDevice(device);
        await this.prisma.deviceMetric.create({
          data: {
            deviceId: device.id,
            battery: metrics.battery,
            uptime: metrics.uptime,
            status: metrics.status,
            temperature: metrics.temperature,
            signalStrength: metrics.signalStrength,
            memoryUsage: metrics.memoryUsage,
          },
        });
      } catch (error: any) {
        await this.prisma.deviceMetric.create({
          data: {
            deviceId: device.id,
            battery: 0,
            uptime: 0,
            status: 'OFFLINE',
            temperature: 0,
            signalStrength: -100,
            memoryUsage: 0,
          },
        });
      }
    });

    await Promise.allSettled(pollPromises);
    return { message: 'Wszystkie urządzenia zostały odpytane pomyślnie' };
  }
}
