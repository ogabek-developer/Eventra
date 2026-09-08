import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Booking } from '../../bookings/model/booking.model';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

interface IPaymentCreationAttr {
  booking_id: number;
  amount: number;
  method?: string;
  status?: PaymentStatus;
}

@Table({
  tableName: 'payments',
  timestamps: true,
})
export class Payment extends Model<Payment, IPaymentCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Booking)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  declare booking_id: number;

  @BelongsTo(() => Booking)
  declare booking: Booking;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare amount: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare method: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  declare status: PaymentStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare paid_at: Date | null;
}
