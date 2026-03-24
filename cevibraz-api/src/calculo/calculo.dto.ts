import { Type } from 'class-transformer';
import {
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// =======================================
// DTOs de cálculo
// =======================================

export class CalcularQuadroDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  altura: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
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
  @Min(0)
  espessuraPaspatur?: number;

  @Type(() => Boolean)
  @IsBoolean()
  limpezaSelecionada: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  medidaFornecidaCliente: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  acrescimo_cm?: number;
}
