import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OrderRequest,
  OrderRequestDocument,
} from './schemas/order-request.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(OrderRequest.name)
    private orderModel: Model<OrderRequestDocument>,
    private mailService: MailService,
  ) {}

  async create(
    dto: CreateOrderDto,
    userId: string,
  ): Promise<OrderRequestDocument> {
    const order = await this.orderModel.create({
      ...dto,
      userId,
      notes: dto.notes || '',
    });

    const itemSummary = dto.items
      .map((i) => `${i.qty}x ${i.name} (₦${i.price})`)
      .join('\n');

    const orderId = order._id.toString();

    await Promise.allSettled([
      this.mailService.notifyAdmin(
        `New order request from ${dto.customerName}`,
        `Customer: ${dto.customerName}\nEmail: ${dto.email}\nPhone: ${dto.phone}\nAddress: ${dto.address}\nNotes: ${dto.notes || '—'}\n\nItems:\n${itemSummary}`,
      ),
      this.mailService.sendOrderConfirmation({
        to: dto.email,
        customerName: dto.customerName,
        orderId,
        itemSummary,
        address: dto.address,
      }),
    ]);

    return order;
  }

  async findAll(): Promise<OrderRequestDocument[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async findMine(userId: string): Promise<OrderRequestDocument[]> {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderRequestDocument> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
