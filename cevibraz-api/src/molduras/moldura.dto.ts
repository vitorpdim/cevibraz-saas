import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMolduraDto {
  @IsString()
  codigo: string;

  @IsString()
  nome: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  valor_metro_linear: number;
}

export class UpdateMolduraDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  valor_metro_linear?: number;
}
