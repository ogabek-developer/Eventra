import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Venue } from './model/venue.model';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';

@Module({
  imports: [SequelizeModule.forFeature([Venue])],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
