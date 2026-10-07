import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.pagesService.findByKey(key);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  update(
    @Param('key') key: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pagesService.update(key, dto, userId);
  }
}
