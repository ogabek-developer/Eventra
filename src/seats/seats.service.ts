import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Seat } from './model/seat.model';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatsService {
  constructor(
    @InjectModel(Seat)
    private readonly seatModel: typeof Seat,
  ) {}

  create(dto: CreateSeatDto): Promise<Seat> {
    return this.seatModel.create({ ...dto });
  }

  findAll(venue_id?: number): Promise<Seat[]> {
    return this.seatModel.findAll({
      where: venue_id ? { venue_id } : undefined,
    });
  }

  async findOne(id: number): Promise<Seat> {
    const seat = await this.seatModel.findByPk(id);

    if (!seat) {
      throw new NotFoundException(`Seat with id ${id} not found`);
    }

    return seat;
  }

  async update(id: number, dto: UpdateSeatDto): Promise<Seat> {
    const seat = await this.findOne(id);
    await seat.update({ ...dto });
    return seat;
  }

  async remove(id: number): Promise<{ message: string }> {
    const seat = await this.findOne(id);
    await seat.destroy();
    return { message: 'Seat deleted successfully' };
  }
}
