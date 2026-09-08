import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Role } from '../../common/enums/role.enum';
import { OtpType } from '../../common/enums/otp-type.enum';
import { Booking } from '../../bookings/model/booking.model';

interface IUserCreationAttr {
  username: string;
  email: string;
  hashed_password: string;
  age: number;
  photo?: string | null;
  role?: Role;
  is_super?: boolean;
  is_verified?: boolean;
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User, IUserCreationAttr> {
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
  declare username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare hashed_password: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare age: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare photo: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    allowNull: false,
    defaultValue: Role.USER,
  })
  declare role: Role;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_super: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare otp: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare otp_time: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(OtpType)),
    allowNull: true,
  })
  declare otp_type: OtpType | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_verified: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare hashed_refresh_token: string | null;

  @HasMany(() => Booking)
  declare bookings: Booking[];

  toJSON() {
    const values = { ...this.get() } as Record<string, unknown>;
    delete values.hashed_password;
    delete values.hashed_refresh_token;
    delete values.otp;
    delete values.otp_time;
    delete values.otp_type;
    return values;
  }
}
