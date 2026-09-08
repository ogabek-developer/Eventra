import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../users/model/user.model';
import { Venue } from '../venues/model/venue.model';
import { Seat } from '../seats/model/seat.model';
import { Event } from '../events/model/event.model';
import { Booking } from '../bookings/model/booking.model';
import { Payment } from '../payments/model/payment.model';

export const getDatabaseConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => ({
  dialect: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<string>('DB_PORT')),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  models: [User, Venue, Seat, Event, Booking, Payment],
  autoLoadModels: true,
  synchronize: true,
  logging: false,
});
