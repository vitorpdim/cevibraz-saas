// =======================================
// Helpers de Cálculo de Quadros
// =======================================

export function arredondarParaCinco(medida: number): number {
  return Math.ceil(medida / 5) * 5;
}

export function cmParaMetro(valorCm: number): number {
  return valorCm / 100;
}

export interface DimensoesQuadro {
  alturaInterna_m: number;
  larguraInterna_m: number;
  perimetroInterno_m: number;
  alturaExterna_m: number;
  larguraExterna_m: number;
  perimetroExterno_m: number;
  areaExterna_m2: number;
}

export function calcularDimensoes(
  altura: number,
  largura: number,
  acrescimo_cm: number,
  espessuraPaspatur: number,
  temPaspatur: boolean,
): DimensoesQuadro {
  const alturaComAcrescimo = altura + acrescimo_cm;
  const larguraComAcrescimo = largura + acrescimo_cm;

  const alturaArredondada = arredondarParaCinco(alturaComAcrescimo);
  const larguraArredondada = arredondarParaCinco(larguraComAcrescimo);

  const alturaInterna_m = cmParaMetro(alturaArredondada);
  const larguraInterna_m = cmParaMetro(larguraArredondada);
  const perimetroInterno_m = (alturaInterna_m + larguraInterna_m) * 2;

  const espessuraReal = Math.max(espessuraPaspatur, 2);

  const alturaExterna_cm = temPaspatur
    ? alturaArredondada + 2 * espessuraReal
    : alturaArredondada;

  const larguraExterna_cm = temPaspatur
    ? larguraArredondada + 2 * espessuraReal
    : larguraArredondada;

  const alturaExterna_m = cmParaMetro(alturaExterna_cm);
  const larguraExterna_m = cmParaMetro(larguraExterna_cm);
  const perimetroExterno_m = (alturaExterna_m + larguraExterna_m) * 2;
  const areaExterna_m2 = alturaExterna_m * larguraExterna_m;

  return {
    alturaInterna_m,
    larguraInterna_m,
    perimetroInterno_m,
    alturaExterna_m,
    larguraExterna_m,
    perimetroExterno_m,
    areaExterna_m2,
  };
}

export function calcularValorMaterial(
  tipoCalculo: string,
  valorBase: number,
  dimensoes: DimensoesQuadro,
): number {
  if (tipoCalculo === 'metro_quadrado') {
    return dimensoes.areaExterna_m2 * valorBase;
  }
  if (tipoCalculo === 'metro_linear') {
    return dimensoes.perimetroInterno_m * valorBase;
  }
  return 0;
}
