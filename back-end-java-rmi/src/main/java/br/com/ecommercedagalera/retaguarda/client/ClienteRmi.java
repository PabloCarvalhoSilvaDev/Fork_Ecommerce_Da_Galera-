package br.com.ecommercedagalera.retaguarda.client;

import br.com.ecommercedagalera.retaguarda.api.AjusteEstoque;
import br.com.ecommercedagalera.retaguarda.api.ResultadoConsolidacaoEstoque;
import br.com.ecommercedagalera.retaguarda.api.ResultadoFechamentoCaixa;
import br.com.ecommercedagalera.retaguarda.api.RetaguardaService;
import br.com.ecommercedagalera.retaguarda.config.Config;

import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.time.LocalDate;

public class ClienteRmi {

  public static void main(String[] args) throws Exception {
    if (args.length == 0) {
      System.out.println("uso: ClienteRmi ping | estoque | caixa [AAAA-MM-DD]");
      return;
    }

    Config config = Config.carregar();
    Registry registry = LocateRegistry.getRegistry(config.rmiHost(), config.rmiRegistryPort());
    RetaguardaService servico = (RetaguardaService) registry.lookup(RetaguardaService.NOME);

    switch (args[0]) {
      case "ping" -> System.out.println(servico.ping());
      case "estoque" -> {
        ResultadoConsolidacaoEstoque r = servico.consolidarEstoque("demo");
        System.out.println("Produtos analisados: " + r.produtosAnalisados());
        System.out.println("Registros de estoque criados: " + r.registrosCriados());
        System.out.println("Divergencias corrigidas: " + r.divergenciasCorrigidas());
        for (AjusteEstoque a : r.ajustes()) {
          System.out.println("  " + a.sku() + ": reservado " + a.reservadoAntes() + " -> " + a.reservadoDepois());
        }
      }
      case "caixa" -> {
        LocalDate dia = args.length > 1 ? LocalDate.parse(args[1]) : null;
        ResultadoFechamentoCaixa r = servico.fecharCaixa(dia, "demo");
        System.out.println("Fechamento do dia " + r.dia());
        System.out.println("Pedidos: " + r.totalPedidos() + " (pagos " + r.pedidosPagos()
            + ", entregues " + r.pedidosEntregues() + ")");
        System.out.println("Subtotal: " + r.subtotal() + " | Frete: " + r.frete() + " | Desconto: " + r.desconto());
        System.out.println("Faturamento: " + r.faturamento());
        System.out.println("Por metodo: " + r.faturamentoPorMetodo());
      }
      default -> System.out.println("comando desconhecido: " + args[0]);
    }
  }
}
