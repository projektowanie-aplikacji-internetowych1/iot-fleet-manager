import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'IoT Fleet Manager API - Active & Running. Access Swagger documentation at /api/docs';
  }
}
