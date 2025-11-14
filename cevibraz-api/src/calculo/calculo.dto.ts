import { Type } from 'class-transformer';
import {
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

// vai ter um class-validator' dps pra validação automática

export class CalcularQuadroDto {
  @Type(() => Number)
  @IsNumber()
  altura: number;

  @Type(() => Number)
  @IsNumber()
  largura: number;

  @IsArray()
  @IsString({ each: true })
  moldurasSelecionadas: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materiaisSelecionados?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  espessuraPaspatur?: number;

  @Type(() => Boolean)
  @IsBoolean()
  limpezaSelecionada: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  medidaFornecidaCliente: boolean;
}
