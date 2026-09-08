import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Venue } from './model/venue.model';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Injectable()
export class VenuesService {
  constructor(
    @InjectModel(Venue)
    private readonly venueModel: typeof Venue,
  ) {}

  create(dto: CreateVenueDto): Promise<Venue> {
    return this.venueModel.create({ ...dto });
  }

  findAll(): Promise<Venue[]> {
    return this.venueModel.findAll();
  }

  async findOne(id: number): Promise<Venue> {
    const venue = await this.venueModel.findByPk(id);

    if (!venue) {
      throw new NotFoundException(`Venue with id ${id} not found`);
    }

    return venue;
  }

  async update(id: number, dto: UpdateVenueDto): Promise<Venue> {
    const venue = await this.findOne(id);
    await venue.update({ ...dto });
    return venue;
  }

  async remove(id: number): Promise<{ message: string }> {
    const venue = await this.findOne(id);
    await venue.destroy();
    return { message: 'Venue deleted successfully' };
  }
}
