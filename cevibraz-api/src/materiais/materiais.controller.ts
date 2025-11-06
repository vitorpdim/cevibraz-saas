import { Controller, Get } from '@nestjs/common';
import { MateriaisService } from './materiais.service';

@Controller('api/materiais')
export class MateriaisController {
  constructor(private readonly materiaisService: MateriaisService) {}

  @Get()
  findAll() {
    return this.materiaisService.findAll();
  }
}
