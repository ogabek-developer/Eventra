import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Booking } from './model/booking.model';
import { Event } from '../events/model/event.model';
import { Seat } from '../seats/model/seat.model';
import { Payment } from '../payments/model/payment.model';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [SequelizeModule.forFeature([Booking, Event, Seat, Payment])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
