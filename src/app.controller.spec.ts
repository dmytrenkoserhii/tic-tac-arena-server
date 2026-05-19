import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: () => undefined,
          },
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API name', () => {
      expect(appController.getHello()).toBe('Tic Tac Arena API');
    });
  });

  describe('health', () => {
    it('should return the health status', () => {
      expect(appController.getHealth()).toEqual({
        service: 'tic-tac-arena-api',
        status: 'ok',
      });
    });
  });

  describe('ready', () => {
    it('should return the readiness status', () => {
      expect(appController.getReady()).toEqual({
        service: 'tic-tac-arena-api',
        status: 'ready',
      });
    });
  });
});
