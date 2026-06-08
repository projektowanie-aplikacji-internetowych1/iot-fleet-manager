import { Injectable, Logger } from '@nestjs/common';
import { Device, AuthProtocol, PrivacyProtocol } from '@prisma/client';
import * as snmp from 'net-snmp';

@Injectable()
export class SnmpService {
  private readonly logger = new Logger(SnmpService.name);

  async pollDevice(device: Device): Promise<{ battery: number; uptime: number; status: string; temperature: number }> {
    return new Promise((resolve, reject) => {
      const oids = [
        '.1.3.6.1.4.1.9999.1.1',
        '.1.3.6.1.4.1.9999.1.2',
        '.1.3.6.1.4.1.9999.1.3',
        '.1.3.6.1.4.1.9999.1.4',
      ];

      let securityLevel = snmp.SecurityLevel.noAuthNoPriv;
      const user: any = {
        name: device.snmpUsername,
      };

      if (device.authProtocol !== AuthProtocol.NONE && device.authPasswordHash) {
        user.authProtocol = device.authProtocol === AuthProtocol.SHA
          ? snmp.AuthProtocols.sha
          : snmp.AuthProtocols.md5;
        user.authKey = device.authPasswordHash;
        securityLevel = snmp.SecurityLevel.authNoPriv;
      }

      if (device.privacyProtocol !== PrivacyProtocol.NONE && device.privacyPasswordHash && device.authProtocol !== AuthProtocol.NONE) {
        user.privProtocol = device.privacyProtocol === PrivacyProtocol.AES
          ? snmp.PrivProtocols.aes
          : snmp.PrivProtocols.des;
        user.privKey = device.privacyPasswordHash;
        securityLevel = snmp.SecurityLevel.authPriv;
      }

      user.level = securityLevel;

      const options: any = {
        port: device.port,
        version: snmp.Version3,
        timeout: 2500,
        retries: 0,
      };

      this.logger.debug(`Polling device "${device.name}" at ${device.ipAddress}:${device.port} using SNMPv3 (Level: ${securityLevel})`);

      const session = snmp.createV3Session(device.ipAddress, user, options);

      session.get(oids, (error: any, varbinds: any[]) => {
        if (error) {
          session.close();
          return reject(error);
        }

        try {
          const metricsMap: Record<string, any> = {};

          for (const varbind of varbinds) {
            if (snmp.isVarbindError(varbind)) {
              this.logger.warn(`Varbind error for OID ${varbind.oid}: ${snmp.varbindError(varbind)}`);
              continue;
            }
            metricsMap[varbind.oid] = varbind.value;
          }

          const rawBattery = metricsMap['.1.3.6.1.4.1.9999.1.1'];
          const rawUptime = metricsMap['.1.3.6.1.4.1.9999.1.2'];
          const rawStatus = metricsMap['.1.3.6.1.4.1.9999.1.3'];
          const rawTemp = metricsMap['.1.3.6.1.4.1.9999.1.4'];

          const battery = typeof rawBattery === 'number' ? rawBattery : parseInt(rawBattery?.toString() || '0', 10);
          const uptime = typeof rawUptime === 'number' ? rawUptime : parseInt(rawUptime?.toString() || '0', 10);
          const statusNum = typeof rawStatus === 'number' ? rawStatus : parseInt(rawStatus?.toString() || '1', 10);
          const temperature = typeof rawTemp === 'number' ? rawTemp : parseFloat(rawTemp?.toString() || '0');

          let status = 'ONLINE';
          if (statusNum === 2) status = 'WARNING';
          if (statusNum === 3) status = 'ERROR';
          if (statusNum === 4) status = 'MAINTENANCE';

          session.close();
          resolve({ battery, uptime, status, temperature });
        } catch (parseError) {
          session.close();
          reject(parseError);
        }
      });
    });
  }
}
