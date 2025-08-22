import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { SearchModuleSimple } from './modules/search/search.module.simple';
import { SearchControllerSimple } from './controllers/search.controller.simple';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    SearchModuleSimple,
  ],
  controllers: [
    AppController, 
    SearchControllerSimple
  ],
  providers: [
    AppService,
  ],
})
export class AppModuleSimple {}