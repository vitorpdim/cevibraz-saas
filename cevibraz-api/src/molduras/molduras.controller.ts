import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MoldurasService } from './molduras.service';
import { CreateMolduraDto, UpdateMolduraDto } from './moldura.dto';

@Controller('api/molduras')
export class MoldurasController {
  constructor(private readonly moldurasService: MoldurasService) {}

  @Get()
  findAll() {
    return this.moldurasService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('imagem'))
  create(
    @Body() createDto: CreateMolduraDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.moldurasService.create(createDto, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('imagem'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMolduraDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.moldurasService.update(id, updateDto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moldurasService.remove(id);
  }
}
