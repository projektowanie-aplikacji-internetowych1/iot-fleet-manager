import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SnmpService } from '../snmp/snmp.service';

@Processor('snmp-polling')
export class TasksProcessor extends WorkerHost {
  private readonly logger = new Logger(TasksProcessor.name);

  constructor(
    private prisma: PrismaService,
    private snmpService: SnmpService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Executing SNMP polling job: ${job.id}`);

    const devices = await this.prisma.device.findMany();
    if (devices.length === 0) {
      this.logger.log('No devices registered for SNMP polling.');
      return;
    }

    this.logger.log(`Found ${devices.length} devices. Polling started...`);

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

        this.logger.debug(`Device "${device.name}" (${device.ipAddress}) polled: Battery=${metrics.battery}%, Temp=${metrics.temperature}°C, Status=${metrics.status}, RSSI=${metrics.signalStrength}dBm, RAM=${metrics.memoryUsage}%`);
      } catch (error: any) {
        this.logger.warn(`Failed to poll device "${device.name}" (${device.ipAddress}): ${error.message || error}`);

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
    this.logger.log(`Completed SNMP polling cycle.`);
  }
}
