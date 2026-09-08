import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Booking } from './model/booking.model';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Event } from '../events/model/event.model';
import { Seat } from '../seats/model/seat.model';
import { Payment } from '../payments/model/payment.model';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { EventStatus } from '../common/enums/event-status.enum';
import { Role } from '../common/enums/role.enum';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking)
    private readonly bookingModel: typeof Booking,
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    @InjectModel(Seat)
    private readonly seatModel: typeof Seat,
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async create(userId: number, dto: CreateBookingDto): Promise<Booking> {
    return this.sequelize.transaction(async (transaction) => {
      // Lock the event row to safely check capacity/status under concurrency.
      const event = await this.eventModel.findByPk(dto.event_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!event) {
        throw new NotFoundException(`Event with id ${dto.event_id} not found`);
      }

      if (event.status !== EventStatus.PUBLISHED) {
        throw new BadRequestException('Event is not open for booking');
      }

      // Lock the seat row.
      const seat = await this.seatModel.findByPk(dto.seat_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!seat) {
        throw new NotFoundException(`Seat with id ${dto.seat_id} not found`);
      }

      if (seat.venue_id !== event.venue_id) {
        throw new BadRequestException(
          'Selected seat does not belong to the venue of this event',
        );
      }

      // Lock any existing active booking rows for this event+seat pair to
      // prevent a race condition between the check and the insert.
      const existingBooking = await this.bookingModel.findOne({
        where: {
          event_id: dto.event_id,
          seat_id: dto.seat_id,
          status: { [Op.ne]: BookingStatus.CANCELLED },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existingBooking) {
        throw new ConflictException(
          'This seat is already booked for the selected event',
        );
      }

      // Reserve the seat by creating the booking record.
      const booking = await this.bookingModel.create(
        {
          user_id: userId,
          event_id: dto.event_id,
          seat_id: dto.seat_id,
          total_amount: dto.total_amount,
          status: BookingStatus.PENDING,
        },
        { transaction },
      );

      // Create the associated pending payment.
      await this.paymentModel.create(
        {
          booking_id: booking.id,
          amount: dto.total_amount,
          status: PaymentStatus.PENDING,
        },
        { transaction },
      );

      return this.bookingModel.findByPk(booking.id, {
        include: [Event, Seat, Payment],
        transaction,
      }) as Promise<Booking>;
    });
  }

  async findAll(user: TokenPayload): Promise<Booking[]> {
    const isAdmin = user.role === Role.ADMIN;

    return this.bookingModel.findAll({
      where: isAdmin ? undefined : { user_id: user.sub },
      include: [Event, Seat, Payment],
    });
  }

  async findOne(id: number, user: TokenPayload): Promise<Booking> {
    const booking = await this.bookingModel.findByPk(id, {
      include: [Event, Seat, Payment],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }

    if (user.role !== Role.ADMIN && booking.user_id !== user.sub) {
      throw new ForbiddenException('You cannot access this booking');
    }

    return booking;
  }

  async cancel(id: number, user: TokenPayload): Promise<Booking> {
    return this.sequelize.transaction(async (transaction) => {
      const booking = await this.bookingModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!booking) {
        throw new NotFoundException(`Booking with id ${id} not found`);
      }

      if (user.role !== Role.ADMIN && booking.user_id !== user.sub) {
        throw new ForbiddenException('You cannot modify this booking');
      }

      await booking.update({ status: BookingStatus.CANCELLED }, { transaction });

      await this.paymentModel.update(
        { status: PaymentStatus.CANCELLED },
        { where: { booking_id: booking.id }, transaction },
      );

      return booking;
    });
  }

  async confirm(id: number): Promise<Booking> {
    const booking = await this.bookingModel.findByPk(id);

    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }

    await booking.update({ status: BookingStatus.CONFIRMED });
    return booking;
  }
}
