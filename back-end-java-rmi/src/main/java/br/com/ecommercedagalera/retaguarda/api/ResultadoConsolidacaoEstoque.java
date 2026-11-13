package br.com.ecommercedagalera.retaguarda.api;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ResultadoConsolidacaoEstoque(
        UUID execucaoId,
        int produtosAnalisados,
        int registrosCriados,
        int divergenciasCorrigidas,
        List<AjusteEstoque> ajustes,
        Instant executadoEm) implements Serializable {
}
