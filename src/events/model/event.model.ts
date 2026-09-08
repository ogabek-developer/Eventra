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
import { EventStatus } from '../../common/enums/event-status.enum';
import { Booking } from '../../bookings/model/booking.model';

interface IEventCreationAttr {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_id: number;
  capacity: number;
  status?: EventStatus;
}

@Table({
  tableName: 'events',
  timestamps: true,
})
export class Event extends Model<Event, IEventCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare date: string;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  declare start_time: string;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  declare end_time: string;

  @ForeignKey(() => Venue)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare venue_id: number;

  @BelongsTo(() => Venue)
  declare venue: Venue;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare capacity: number;

  @Column({
    type: DataType.ENUM(...Object.values(EventStatus)),
    allowNull: false,
    defaultValue: EventStatus.DRAFT,
  })
  declare status: EventStatus;

  @HasMany(() => Booking)
  declare bookings: Booking[];
}
