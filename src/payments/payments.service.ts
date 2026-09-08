import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Payment } from './model/payment.model';
import { Booking } from '../bookings/model/booking.model';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { Role } from '../common/enums/role.enum';
import { TokenPayload } from '../auth/interfaces/token-payload.interface';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
    @InjectModel(Booking)
    private readonly bookingModel: typeof Booking,
  ) {}

  async create(user: TokenPayload, dto: CreatePaymentDto): Promise<Payment> {
    const booking = await this.bookingModel.findByPk(dto.booking_id);

    if (!booking) {
      throw new NotFoundException(
        `Booking with id ${dto.booking_id} not found`,
      );
    }

    if (user.role !== Role.ADMIN && booking.user_id !== user.sub) {
      throw new ForbiddenException('You cannot pay for this booking');
    }

    let payment = await this.paymentModel.findOne({
      where: { booking_id: dto.booking_id },
    });

    if (payment) {
      await payment.update({
        status: PaymentStatus.PAID,
        method: dto.method ?? payment.method,
        paid_at: new Date(),
      });
    } else {
      payment = await this.paymentModel.create({
        booking_id: dto.booking_id,
        amount: dto.amount,
        method: dto.method,
        status: PaymentStatus.PAID,
      });
      await payment.update({ paid_at: new Date() });
    }

    await booking.update({ status: BookingStatus.CONFIRMED });

    return payment;
  }

  async findAll(user: TokenPayload): Promise<Payment[]> {
    const isAdmin = user.role === Role.ADMIN;

    return this.paymentModel.findAll({
      include: [
        {
          model: Booking,
          where: isAdmin ? undefined : { user_id: user.sub },
        },
      ],
    });
  }

  async findOne(id: number, user: TokenPayload): Promise<Payment> {
    const payment = await this.paymentModel.findByPk(id, {
      include: [Booking],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    if (user.role !== Role.ADMIN && payment.booking?.user_id !== user.sub) {
      throw new ForbiddenException('You cannot access this payment');
    }

    return payment;
  }
}
