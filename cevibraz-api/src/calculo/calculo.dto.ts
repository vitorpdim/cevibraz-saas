// vai ter um class-validator' dps pra validação automática

export class CalcularQuadroDto {
  altura: number;
  largura: number;
  moldurasSelecionadas: string[];
  materiaisSelecionados: string[];
  espessuraPaspatur: number;
  limpezaSelecionada: boolean;
  medidaFornecidaCliente: boolean;
}
