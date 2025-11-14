import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CalculoService } from './calculo.service';
import { CalcularQuadroDto } from './calculo.dto';

@Controller('api/quadro')
export class CalculoController {
  private readonly logger = new Logger(CalculoController.name);

  constructor(private readonly calculoService: CalculoService) {}

  @Post('calcular')
  async calcularPreco(@Body() calcularQuadroDto: CalcularQuadroDto) {
    try {
      // opcional: log para debugging em dev
      this.logger.debug(
        `Recebendo calcularQuadroDto: ${JSON.stringify(calcularQuadroDto)}`,
      );
      return await this.calculoService.calcularPrecoQuadro(calcularQuadroDto);
    } catch (error: unknown) {
      this.logger.error(
        'Erro no cálculo do quadro:',
        (error as Error).stack || error,
      );
      // Retorna 400 com mensagem explicativa (se o serviço lançar validação própria)
      throw new BadRequestException(
        (error as Error)?.message || 'Erro ao calcular quadro',
      );
    }
  }
}
