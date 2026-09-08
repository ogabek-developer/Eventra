import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Venue } from '../../venues/model/venue.model';
import { SeatType } from '../../common/enums/seat-type.enum';
import { Booking } from '../../bookings/model/booking.model';

interface ISeatCreationAttr {
  venue_id: number;
  row: string;
  number: number;
  type?: SeatType;
}

@Table({
  tableName: 'seats',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['venue_id', 'row', 'number'],
    },
  ],
})
export class Seat extends Model<Seat, ISeatCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Venue)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare venue_id: number;

  @BelongsTo(() => Venue)
  declare venue: Venue;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare row: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare number: number;

  @Column({
    type: DataType.ENUM(...Object.values(SeatType)),
    allowNull: false,
    defaultValue: SeatType.REGULAR,
  })
  declare type: SeatType;

  @HasMany(() => Booking)
  declare bookings: Booking[];
}
