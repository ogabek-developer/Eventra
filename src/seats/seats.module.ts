import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Seat } from './model/seat.model';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';

@Module({
  imports: [SequelizeModule.forFeature([Seat])],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}
