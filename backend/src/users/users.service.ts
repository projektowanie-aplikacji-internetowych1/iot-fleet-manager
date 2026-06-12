import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Użytkownik o identyfikatorze ${id} nie został znaleziony`);
    }

    return user;
  }

  async create(dto: CreateUserDto, defaultOrgId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Podany adres e-mail już istnieje');
    }

    let targetOrgId = dto.organizationId || defaultOrgId;

    const org = await this.prisma.organization.findUnique({
      where: { id: targetOrgId },
    });
    if (!org) {
      throw new BadRequestException('Docelowa organizacja nie istnieje');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        role: dto.role || Role.USER,
        organizationId: targetOrgId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto, userOrgId: string, isAdmin: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Użytkownik o identyfikatorze ${id} nie został znaleziony`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Podany adres e-mail już istnieje');
      }
    }

    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    if (isAdmin) {
      if (dto.role) data.role = dto.role;
      if (dto.organizationId) {
        const org = await this.prisma.organization.findUnique({
          where: { id: dto.organizationId },
        });
        if (!org) {
          throw new BadRequestException('Docelowa organizacja nie istnieje');
        }
        data.organizationId = dto.organizationId;
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Użytkownik o identyfikatorze ${id} nie został znaleziony`);
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Nie można usunąć jedynego Administratora w systemie');
      }
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
