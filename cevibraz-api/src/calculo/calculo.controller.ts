import { Controller, Post, Body } from '@nestjs/common';
import { CalculoService } from './calculo.service';
import { CalcularQuadroDto } from './calculo.dto';

@Controller('api/quadro')
export class CalculoController {
  constructor(private readonly calculoService: CalculoService) {}

  @Post('calcular')
  calcularPreco(@Body() calcularQuadroDto: CalcularQuadroDto) {
    return this.calculoService.calcularPrecoQuadro(calcularQuadroDto);
  }
}
