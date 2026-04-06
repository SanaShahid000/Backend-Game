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
            console.log(`Checking MongoDB SRV record for ${hostname}...`);
            // Skip the SRV check if it's hanging
          }
        }

        console.log(`Connecting to MongoDB at ${uri.replace(/\/\/.*@/, '//****:****@')}...`);
        return { uri };
      },
    }),
  ],
})
export class DatabaseModule {}
