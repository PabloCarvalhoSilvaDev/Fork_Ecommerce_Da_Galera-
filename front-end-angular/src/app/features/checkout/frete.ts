/**
 * Frete do mock: grátis a partir de um valor, senão taxa fixa.
 * TODO: o cálculo real depende do CEP e virá do back no checkout.
 */
export const FRETE_GRATIS_A_PARTIR_DE = 299;
const FRETE_FIXO = 24.9;

export function calcularFrete(subtotal: number): number {
  return subtotal === 0 || subtotal >= FRETE_GRATIS_A_PARTIR_DE ? 0 : FRETE_FIXO;
}
