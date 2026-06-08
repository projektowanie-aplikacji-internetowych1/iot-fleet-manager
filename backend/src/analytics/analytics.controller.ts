import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('battery')
  @ApiOperation({ summary: 'Get battery health aggregation (Admins see global, Users see organization-only)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved battery analytics.' })
  async getBatteryAnalytics(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.analyticsService.getBatteryAnalytics();
    }
    return this.analyticsService.getBatteryAnalytics(user.organizationId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get device status counts (Admins see global, Users see organization-only)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved status analytics.' })
  async getStatusAnalytics(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.analyticsService.getStatusAnalytics();
    }
    return this.analyticsService.getStatusAnalytics(user.organizationId);
  }
}
