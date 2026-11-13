package br.com.ecommercedagalera.retaguarda.jobs;

import br.com.ecommercedagalera.retaguarda.api.AjusteEstoque;
import br.com.ecommercedagalera.retaguarda.api.ResultadoConsolidacaoEstoque;
import br.com.ecommercedagalera.retaguarda.db.Banco;
import br.com.ecommercedagalera.retaguarda.db.RegistroExecucoes;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ConsolidacaoEstoqueJob {

  public static final String NOME = "CONSOLIDACAO_ESTOQUE";

  private final Banco banco;
  private final RegistroExecucoes execucoes;

  public ConsolidacaoEstoqueJob(Banco banco, RegistroExecucoes execucoes) {
    this.banco = banco;
    this.execucoes = execucoes;
  }

  public synchronized ResultadoConsolidacaoEstoque executar(String disparadoPor) throws SQLException {
    Instant inicio = Instant.now();
    return banco.emTransacao(disparadoPor, conexao -> {
      int criados = criarEstoqueFaltante(conexao);
      List<AjusteEstoque> linhas = new ArrayList<>();
      String sql = """
          SELECT i.product_id, p.sku, i.quantity, i.reserved_quantity
          FROM ecommerce.inventory i
          JOIN ecommerce.products p ON p.id = i.product_id
          ORDER BY i.product_id
          FOR UPDATE OF i
          """;
      try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
        while (rs.next()) {
          int reservado = rs.getInt("reserved_quantity");
          linhas.add(new AjusteEstoque(rs.getObject("product_id", UUID.class), rs.getString("sku"),
              rs.getInt("quantity"), reservado, reservado));
        }
      }

      Map<UUID, Integer> pendentes = reservasPendentes(conexao);
      List<AjusteEstoque> ajustes = new ArrayList<>();
      for (AjusteEstoque l : linhas) {
        int esperado = Math.min(pendentes.getOrDefault(l.produtoId(), 0), l.quantidadeFisica());
        if (l.reservadoAntes() != esperado) {
          ajustes.add(new AjusteEstoque(l.produtoId(), l.sku(), l.quantidadeFisica(), l.reservadoAntes(), esperado));
        }
      }
      int analisados = linhas.size();

      try (PreparedStatement ps = conexao.prepareStatement(
          "UPDATE ecommerce.inventory SET reserved_quantity = ?, version = version + 1 WHERE product_id = ?")) {
        for (AjusteEstoque a : ajustes) {
          ps.setInt(1, a.reservadoDepois());
          ps.setObject(2, a.produtoId());
          ps.executeUpdate();
        }
      }

      String resumo = "{\"produtos_analisados\": " + analisados
          + ", \"registros_criados\": " + criados
          + ", \"divergencias_corrigidas\": " + ajustes.size() + "}";
      UUID execucaoId = execucoes.sucesso(conexao, NOME, disparadoPor, resumo, inicio);
      return new ResultadoConsolidacaoEstoque(execucaoId, analisados, criados, ajustes.size(), ajustes, Instant.now());
    });
  }

  private int criarEstoqueFaltante(Connection conexao) throws SQLException {
    String sql = """
        INSERT INTO ecommerce.inventory (product_id)
        SELECT p.id FROM ecommerce.products p
        WHERE p.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM ecommerce.inventory i WHERE i.product_id = p.id)
        """;
    try (Statement st = conexao.createStatement()) {
      return st.executeUpdate(sql);
    }
  }

  private Map<UUID, Integer> reservasPendentes(Connection conexao) throws SQLException {
    String sql = """
        SELECT oi.product_id, SUM(oi.quantity) AS total
        FROM ecommerce.order_items oi
        JOIN ecommerce.orders o ON o.id = oi.order_id
        WHERE o.status = 'PENDING'
        GROUP BY oi.product_id
        """;
    Map<UUID, Integer> mapa = new HashMap<>();
    try (Statement st = conexao.createStatement(); ResultSet rs = st.executeQuery(sql)) {
      while (rs.next()) {
        mapa.put(rs.getObject("product_id", UUID.class), rs.getInt("total"));
      }
    }
    return mapa;
  }
}
