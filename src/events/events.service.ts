import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Event } from './model/event.model';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Venue } from '../venues/model/venue.model';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
  ) {}

  create(dto: CreateEventDto): Promise<Event> {
    return this.eventModel.create({ ...dto });
  }

  findAll(): Promise<Event[]> {
    return this.eventModel.findAll({ include: [Venue] });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventModel.findByPk(id, { include: [Venue] });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    await event.update({ ...dto });
    return event;
  }

  async remove(id: number): Promise<{ message: string }> {
    const event = await this.findOne(id);
    await event.destroy();
    return { message: 'Event deleted successfully' };
  }
}
