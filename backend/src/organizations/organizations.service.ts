import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Organizacja o tej nazwie już istnieje');
    }

    return this.prisma.organization.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        devices: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organizacja o identyfikatorze ${id} nie została znaleziona`);
    }

    return org;
  }

  async remove(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!org) {
      throw new NotFoundException(`Organizacja o identyfikatorze ${id} nie została znaleziona`);
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }
}
