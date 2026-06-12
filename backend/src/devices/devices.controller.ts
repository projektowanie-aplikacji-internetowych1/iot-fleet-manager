import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new device (Users add to their own organization; Admins can specify organization)' })
  @ApiResponse({ status: 201, description: 'Device successfully added.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createDeviceDto: CreateDeviceDto, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.role === Role.ADMIN;
    return this.devicesService.create(createDeviceDto, user.organizationId, isAdmin);
  }

  @Get()
  @ApiOperation({ summary: 'List all devices (Admins see all, Users see only their organization)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved devices list.' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.devicesService.findAll();
    }
    return this.devicesService.findAll(user.organizationId);
  }

  @Post('poll')
  @ApiOperation({ summary: 'Poll all devices in user\'s organization on demand' })
  @ApiResponse({ status: 200, description: 'All devices polled successfully.' })
  async pollAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.devicesService.pollAllDevicesOnDemand();
    }
    return this.devicesService.pollAllDevicesOnDemand(user.organizationId);
  }

  @Post(':id/poll')
  @ApiOperation({ summary: 'Poll a specific device on demand' })
  @ApiResponse({ status: 200, description: 'Device polled successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async pollOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.findOne(id);
    if (user.role !== Role.ADMIN && device.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this device');
    }
    return this.devicesService.pollDeviceOnDemand(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific device' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved device details.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied to devices in other organizations.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.findOne(id);
    if (user.role !== Role.ADMIN && device.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this device');
    }
    return device;
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get historical metrics for a specific device' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved historical metrics.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied to devices in other organizations.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async findMetrics(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.findOne(id);
    if (user.role !== Role.ADMIN && device.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this device');
    }
    return this.devicesService.getDeviceMetrics(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiResponse({ status: 200, description: 'Device successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: CreateDeviceDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const device = await this.devicesService.findOne(id);
    if (user.role !== Role.ADMIN && device.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this device');
    }
    const isAdmin = user.role === Role.ADMIN;
    return this.devicesService.update(id, updateDeviceDto, user.organizationId, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a device' })
  @ApiResponse({ status: 200, description: 'Device successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied.' })
  @ApiResponse({ status: 404, description: 'Device not found.' })
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.findOne(id);
    if (user.role !== Role.ADMIN && device.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this device');
    }
    return this.devicesService.remove(id);
  }
}
