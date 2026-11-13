package br.com.ecommercedagalera.retaguarda.api;

import java.io.Serializable;
import java.util.UUID;

public record AjusteEstoque(
        UUID produtoId,
        String sku,
        int quantidadeFisica,
        int reservadoAntes,
        int reservadoDepois) implements Serializable {
}
