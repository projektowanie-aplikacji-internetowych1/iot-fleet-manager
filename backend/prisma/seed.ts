import { PrismaClient, Role, AuthProtocol, PrivacyProtocol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  await prisma.deviceMetric.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Cleared existing database records.');

  const orgA = await prisma.organization.create({
    data: { name: 'SpaceX Fleet' },
  });

  const orgB = await prisma.organization.create({
    data: { name: 'Blue Origin Fleet' },
  });

  const orgC = await prisma.organization.create({
    data: { name: 'DJI Enterprise' },
  });

  console.log(`Created organizations: ${orgA.name}, ${orgB.name}, ${orgC.name}`);

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@iot.com',
      password: adminPasswordHash,
      role: Role.ADMIN,
      organizationId: orgA.id,
    },
  });

  const userA = await prisma.user.create({
    data: {
      email: 'usera@iot.com',
      password: userPasswordHash,
      role: Role.USER,
      organizationId: orgA.id,
    },
  });

  const userB = await prisma.user.create({
    data: {
      email: 'userb@iot.com',
      password: userPasswordHash,
      role: Role.USER,
      organizationId: orgB.id,
    },
  });

  const userC = await prisma.user.create({
    data: {
      email: 'userc@iot.com',
      password: userPasswordHash,
      role: Role.USER,
      organizationId: orgC.id,
    },
  });

  const userD = await prisma.user.create({
    data: {
      email: 'userd@iot.com',
      password: userPasswordHash,
      role: Role.USER,
      organizationId: orgA.id,
    },
  });

  const adminB = await prisma.user.create({
    data: {
      email: 'adminb@iot.com',
      password: adminPasswordHash,
      role: Role.ADMIN,
      organizationId: orgB.id,
    },
  });

  console.log(`Created users:
    - Admin:   admin@iot.com  (Pass: admin123, Role: ADMIN, Org: ${orgA.name})
    - Admin B: adminb@iot.com (Pass: admin123, Role: ADMIN, Org: ${orgB.name})
    - User A:  usera@iot.com  (Pass: user123,  Role: USER,  Org: ${orgA.name})
    - User B:  userb@iot.com  (Pass: user123,  Role: USER,  Org: ${orgB.name})
    - User C:  userc@iot.com  (Pass: user123,  Role: USER,  Org: ${orgC.name})
    - User D:  userd@iot.com  (Pass: user123,  Role: USER,  Org: ${orgA.name})`);


  const dev1 = await prisma.device.create({
    data: {
      name: 'Drone Alpha',
      ipAddress: 'mock-device-1',
      port: 161,
      authProtocol: AuthProtocol.SHA,
      authPasswordHash: 'authPassword123',
      privacyProtocol: PrivacyProtocol.AES,
      privacyPasswordHash: 'privPassword456',
      snmpUsername: 'bootstrapUser',
      organizationId: orgA.id,
    },
  });

  const dev2 = await prisma.device.create({
    data: {
      name: 'Drone Beta',
      ipAddress: 'mock-device-2',
      port: 161,
      authProtocol: AuthProtocol.SHA,
      authPasswordHash: 'authPassword123',
      privacyProtocol: PrivacyProtocol.AES,
      privacyPasswordHash: 'privPassword456',
      snmpUsername: 'bootstrapUser',
      organizationId: orgA.id,
    },
  });

  const dev3 = await prisma.device.create({
    data: {
      name: 'Drone Gamma',
      ipAddress: 'mock-device-3',
      port: 161,
      authProtocol: AuthProtocol.SHA,
      authPasswordHash: 'authPassword123',
      privacyProtocol: PrivacyProtocol.AES,
      privacyPasswordHash: 'privPassword456',
      snmpUsername: 'bootstrapUser',
      organizationId: orgB.id,
    },
  });

  const dev4 = await prisma.device.create({
    data: {
      name: 'Sensor Hub X1',
      ipAddress: 'mock-device-1',
      port: 161,
      authProtocol: AuthProtocol.SHA,
      authPasswordHash: 'authPassword123',
      privacyProtocol: PrivacyProtocol.AES,
      privacyPasswordHash: 'privPassword456',
      snmpUsername: 'bootstrapUser',
      organizationId: orgC.id,
    },
  });

  const dev5 = await prisma.device.create({
    data: {
      name: 'Drone Delta',
      ipAddress: 'mock-device-2',
      port: 161,
      authProtocol: AuthProtocol.SHA,
      authPasswordHash: 'authPassword123',
      privacyProtocol: PrivacyProtocol.AES,
      privacyPasswordHash: 'privPassword456',
      snmpUsername: 'bootstrapUser',
      organizationId: orgB.id,
    },
  });

  console.log(`Created devices:
    - ${dev1.name} (IP: ${dev1.ipAddress}, Org: ${orgA.name})
    - ${dev2.name} (IP: ${dev2.ipAddress}, Org: ${orgA.name})
    - ${dev3.name} (IP: ${dev3.ipAddress}, Org: ${orgB.name})
    - ${dev4.name} (IP: ${dev4.ipAddress}, Org: ${orgC.name})
    - ${dev5.name} (IP: ${dev5.ipAddress}, Org: ${orgB.name})`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
