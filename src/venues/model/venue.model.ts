import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Seat } from '../../seats/model/seat.model';
import { Event } from '../../events/model/event.model';

interface IVenueCreationAttr {
  name: string;
  address: string;
  city: string;
  capacity: number;
}

@Table({
  tableName: 'venues',
  timestamps: true,
})
export class Venue extends Model<Venue, IVenueCreationAttr> {
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
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare address: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare city: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare capacity: number;

  @HasMany(() => Seat)
  declare seats: Seat[];

  @HasMany(() => Event)
  declare events: Event[];
}
