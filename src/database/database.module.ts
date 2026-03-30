import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { promises as dnsPromises, setServers as dnsSetServers } from 'dns';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGO_URI') ??
          configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGO_URI (or MONGODB_URI) is not set');
        }

        const dnsServersRaw = configService.get<string>('MONGO_DNS_SERVERS');
        const dnsServers = dnsServersRaw
          ? dnsServersRaw
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        if (dnsServers.length > 0) {
          dnsSetServers(dnsServers);
        }

        if (uri.startsWith('mongodb+srv://')) {
          const hostname = uri
            .replace(/^mongodb\+srv:\/\//, '')
            .split('@')
            .pop()
            ?.split('/')[0]
            ?.split('?')[0];

          if (hostname) {
            try {
              await dnsPromises.resolveSrv(`_mongodb._tcp.${hostname}`);
            } catch (error) {
              const code =
                error && typeof error === 'object' && 'code' in error
                  ? String((error as { code?: unknown }).code)
                  : '';
              if (code === 'ENODATA' || code === 'ENOTFOUND') {
                throw new Error(
                  `MongoDB SRV DNS lookup failed for ${hostname}. ` +
                    `Use a standard (non-SRV) MongoDB connection string (mongodb://...) from Atlas, ` +
                    `or set MONGO_DNS_SERVERS=1.1.1.1,8.8.8.8 and retry.`,
                );
              }
              throw error;
            }
          }
        }

        return { uri };
      },
    }),
  ],
})
export class DatabaseModule {}
