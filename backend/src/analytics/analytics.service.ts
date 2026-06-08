import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  async getBatteryAnalytics(organizationId?: string) {
    const devices = await this.prisma.device.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        metrics: {
          orderBy: { collectedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (devices.length === 0) {
      return {
        averageBattery: 0,
        devices: [],
      };
    }

    let totalBattery = 0;
    const deviceList = devices.map((device) => {
      const latestMetric = device.metrics[0];
      const battery = latestMetric ? latestMetric.battery : 0;
      totalBattery += battery;

      return {
        id: device.id,
        name: device.name,
        ipAddress: device.ipAddress,
        battery,
        status: latestMetric ? latestMetric.status : 'OFFLINE',
      };
    });

    deviceList.sort((a, b) => a.battery - b.battery);

    return {
      averageBattery: Math.round(totalBattery / devices.length),
      devices: deviceList,
    };
  }

  async getStatusAnalytics(organizationId?: string) {
    const devices = await this.prisma.device.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        metrics: {
          orderBy: { collectedAt: 'desc' },
          take: 1,
        },
      },
    });

    const stats = {
      ONLINE: 0,
      WARNING: 0,
      ERROR: 0,
      OFFLINE: 0,
      total: devices.length,
    };

    for (const device of devices) {
      const latestMetric = device.metrics[0];
      const status = latestMetric ? (latestMetric.status as keyof typeof stats) : 'OFFLINE';

      if (status in stats) {
        stats[status]++;
      } else {
        stats['OFFLINE']++;
      }
    }

    return stats;
  }
}
