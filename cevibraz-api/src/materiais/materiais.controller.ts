import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MateriaisService } from './materiais.service';
import { Material } from './material.entity';

@Controller('api/materiais')
export class MateriaisController {
  constructor(private readonly materiaisService: MateriaisService) {}

  @Get()
  findAll() {
    return this.materiaisService.findAll();
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dados: Partial<Material>,
  ) {
    return this.materiaisService.update(id, dados);
  }
}
