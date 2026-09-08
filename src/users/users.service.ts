import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from './model/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashed_password = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      username: dto.username,
      email: dto.email,
      hashed_password,
      age: dto.age,
      photo: dto.photo ?? null,
      role: Role.USER,
      is_super: false,
      is_verified: false,
    });

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    await user.update({ ...dto });
    return user;
  }

  async updatePhoto(id: number, photoPath: string): Promise<User> {
    const user = await this.findOne(id);
    await user.update({ photo: photoPath });
    return user;
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);

    if (user.role === Role.ADMIN && user.is_super) {
      const activeSuperAdmins = await this.userModel.count({
        where: { role: Role.ADMIN, is_super: true },
      });

      if (activeSuperAdmins <= 1) {
        throw new ConflictException(
          'The last active Super Admin cannot be removed',
        );
      }
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}
