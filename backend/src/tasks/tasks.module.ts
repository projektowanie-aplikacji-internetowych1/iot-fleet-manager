import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksProcessor } from './tasks.processor';
import { SnmpModule } from '../snmp/snmp.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'snmp-polling',
    }),
    SnmpModule,
  ],
  providers: [TasksService, TasksProcessor],
})
export class TasksModule {}
