// =======================================
// Helpers de cálculo — frontend
// =======================================

export function arredondarParaCinco(medida: number): number {
  return Math.ceil(medida / 5) * 5;
}

export function cmParaMetro(valorCm: number): number {
  return valorCm / 100;
}

export function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parsearNumero(valor: string, fallback = 0): number {
  const parsed = parseFloat(valor);
  return isNaN(parsed) ? fallback : parsed;
}

export function downloadBase64ComoPdf(base64Data: string, filename: string): void {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64Data}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
