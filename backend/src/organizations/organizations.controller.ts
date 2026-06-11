import { Controller, Get, Post, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) { }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new organization (Admin only)' })
  @ApiResponse({ status: 201, description: 'Organization successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  @ApiResponse({ status: 409, description: 'Organization name already exists.' })
  async create(@Body() createDto: CreateOrganizationDto) {
    return this.orgService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations (Admins see all, Users see only their own)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved organizations list.' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.orgService.findAll();
    }
    const org = await this.orgService.findOne(user.organizationId);
    return [org];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific organization' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved organization details.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied to other organizations.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    if (user.role !== Role.ADMIN && user.organizationId !== id) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return this.orgService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete organization and cascade delete users/devices (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  async remove(@Param('id') id: string) {
    return this.orgService.remove(id);
  }
}
