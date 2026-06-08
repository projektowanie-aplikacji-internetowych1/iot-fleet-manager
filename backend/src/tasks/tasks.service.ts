import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(@InjectQueue('snmp-polling') private snmpQueue: Queue) { }

  async onModuleInit() {
    this.logger.log('Initializing repeatable SNMP polling job...');

    try {
      const repeatableJobs = await this.snmpQueue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await this.snmpQueue.removeRepeatableByKey(job.key);
      }
      await this.snmpQueue.add(
        'poll-devices-job',
        {},
        {
          repeat: {
            every: 30000,
          },
          removeOnComplete: true,
          removeOnFail: true,
        },
      );

      this.logger.log('Repeatable SNMP polling job scheduled successfully (every 30 seconds).');
    } catch (err: any) {
      this.logger.error('Failed to schedule repeatable SNMP polling job:', err);
    }
  }
}
