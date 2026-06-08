import { Test, TestingModule } from '@nestjs/testing';
import { DevicesService } from './devices.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DevicesService', () => {
  let service: DevicesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    device: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    deviceMetric: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new device under user organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      mockPrismaService.device.create.mockResolvedValue({ id: 'dev-1', name: 'Device 1' });

      const result = await service.create(
        {
          name: 'Device 1',
          ipAddress: '127.0.0.1',
          port: 161,
        },
        'org-1',
        false,
      );

      expect(result).toEqual({ id: 'dev-1', name: 'Device 1' });
      expect(mockPrismaService.device.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if target organization does not exist', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Device 1',
            ipAddress: '127.0.0.1',
          },
          'org-1',
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should list all devices', async () => {
      const devices = [{ id: 'dev-1', name: 'Dev 1' }, { id: 'dev-2', name: 'Dev 2' }];
      mockPrismaService.device.findMany.mockResolvedValue(devices);

      const result = await service.findAll();
      expect(result).toEqual(devices);
      expect(mockPrismaService.device.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return device details if exists', async () => {
      const device = { id: 'dev-1', name: 'Dev 1', organizationId: 'org-1', metrics: [] };
      mockPrismaService.device.findUnique.mockResolvedValue(device);

      const result = await service.findOne('dev-1');
      expect(result).toEqual(device);
    });

    it('should throw NotFoundException if device not found', async () => {
      mockPrismaService.device.findUnique.mockResolvedValue(null);

      await expect(service.findOne('dev-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete device if exists', async () => {
      mockPrismaService.device.findUnique.mockResolvedValue({ id: 'dev-1' });
      mockPrismaService.device.delete.mockResolvedValue({ id: 'dev-1' });

      const result = await service.remove('dev-1');
      expect(result).toEqual({ id: 'dev-1' });
    });

    it('should throw NotFoundException if trying to delete missing device', async () => {
      mockPrismaService.device.findUnique.mockResolvedValue(null);

      await expect(service.remove('dev-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDeviceMetrics', () => {
    it('should return historical metrics sorted chronologically (oldest first)', async () => {
      const mockMetrics = [
        { id: 'm-2', collectedAt: new Date('2026-06-08T12:01:00Z'), battery: 99 },
        { id: 'm-1', collectedAt: new Date('2026-06-08T12:00:00Z'), battery: 100 },
      ];
      mockPrismaService.deviceMetric.findMany.mockResolvedValue(mockMetrics);

      const result = await service.getDeviceMetrics('dev-1');

      expect(result[0].id).toBe('m-1');
      expect(result[1].id).toBe('m-2');
    });
  });
});
