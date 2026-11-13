package br.com.ecommercedagalera.retaguarda.api;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record ResultadoFechamentoCaixa(
        UUID fechamentoId,
        LocalDate dia,
        int totalPedidos,
        int pedidosPagos,
        int pedidosEntregues,
        BigDecimal subtotal,
        BigDecimal frete,
        BigDecimal desconto,
        BigDecimal faturamento,
        Map<String, BigDecimal> faturamentoPorMetodo,
        Instant executadoEm) implements Serializable {
}
