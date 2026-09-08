import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { User } from '../../users/model/user.model';
import { Event } from '../../events/model/event.model';
import { Seat } from '../../seats/model/seat.model';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { Payment } from '../../payments/model/payment.model';

interface IBookingCreationAttr {
  user_id: number;
  event_id: number;
  seat_id: number;
  total_amount: number;
  status?: BookingStatus;
}

@Table({
  tableName: 'bookings',
  timestamps: true,
  indexes: [
    {
      // Prevents the same seat being actively booked twice for the same
      // event at the database level (double-booking protection).
      unique: true,
      fields: ['event_id', 'seat_id'],
      where: {
        status: { [Op.ne]: BookingStatus.CANCELLED },
      },
      name: 'unique_active_event_seat_booking',
    },
  ],
})
export class Booking extends Model<Booking, IBookingCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare user_id: number;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Event)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare event_id: number;

  @BelongsTo(() => Event)
  declare event: Event;

  @ForeignKey(() => Seat)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare seat_id: number;

  @BelongsTo(() => Seat)
  declare seat: Seat;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare total_amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(BookingStatus)),
    allowNull: false,
    defaultValue: BookingStatus.PENDING,
  })
  declare status: BookingStatus;

  @HasOne(() => Payment)
  declare payment: Payment;
}
