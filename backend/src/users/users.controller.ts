import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile info' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOne(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user email or password' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(@Body() updateDto: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const payload = {
      email: updateDto.email,
      password: updateDto.password,
    };
    return this.usersService.update(user.id, payload, user.organizationId, false);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account (self-deletion)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot delete last admin.' })
  async removeSelf(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.remove(user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user account (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async create(@Body() createDto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(createDto, user.organizationId);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user account by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.usersService.update(id, updateDto, user.organizationId, true);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user account by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot delete last admin.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin access required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
