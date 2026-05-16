import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MonitoringModule } from './monitoring/monitoring.module';
import { GamesModule } from './modules/games/games.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { SupabaseModule } from './supabase/supabase.module';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    GamesModule,
    MonitoringModule,
    ProfilesModule,
    RoomsModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
