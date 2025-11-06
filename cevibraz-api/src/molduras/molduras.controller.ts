import { Controller, Get } from '@nestjs/common';
import { MoldurasService } from './molduras.service';

@Controller('api/molduras')
export class MoldurasController {
  constructor(private readonly moldurasService: MoldurasService) {}

  @Get()
  findAll() {
    return this.moldurasService.findAll();
  }
}
