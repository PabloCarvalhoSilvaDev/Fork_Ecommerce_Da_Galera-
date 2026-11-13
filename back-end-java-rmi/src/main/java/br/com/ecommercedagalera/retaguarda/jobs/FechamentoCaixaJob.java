package br.com.ecommercedagalera.retaguarda.jobs;

import br.com.ecommercedagalera.retaguarda.api.ResultadoFechamentoCaixa;
import br.com.ecommercedagalera.retaguarda.db.Banco;
import br.com.ecommercedagalera.retaguarda.db.RegistroExecucoes;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public class FechamentoCaixaJob {

  public static final String NOME = "FECHAMENTO_CAIXA";

  private final Banco banco;
  private final RegistroExecucoes execucoes;
  private final ZoneId fuso;

  public FechamentoCaixaJob(Banco banco, RegistroExecucoes execucoes, ZoneId fuso) {
    this.banco = banco;
    this.execucoes = execucoes;
    this.fuso = fuso;
  }

  public synchronized ResultadoFechamentoCaixa executar(LocalDate diaInformado, String disparadoPor)
      throws SQLException {
    Instant inicio = Instant.now();
    LocalDate dia = diaInformado != null ? diaInformado : LocalDate.now(fuso);
    OffsetDateTime de = dia.atStartOfDay(fuso).toOffsetDateTime();
    OffsetDateTime ate = dia.plusDays(1).atStartOfDay(fuso).toOffsetDateTime();

    return banco.emTransacao(disparadoPor, conexao -> {
      int total, pagos, entregues;
      BigDecimal subtotal, frete, desconto, faturamento;

      String sqlTotais = """
          SELECT COUNT(*) AS total,
                 COUNT(*) FILTER (WHERE status = 'PAID') AS pagos,
                 COUNT(*) FILTER (WHERE status = 'DELIVERED') AS entregues,
                 COALESCE(SUM(subtotal), 0) AS subtotal,
                 COALESCE(SUM(shipping_cost), 0) AS frete,
                 COALESCE(SUM(discount), 0) AS desconto,
                 COALESCE(SUM(total_amount), 0) AS faturamento
          FROM ecommerce.orders
          WHERE status IN ('PAID', 'DELIVERED')
            AND created_at >= ? AND created_at < ?
          """;
      try (PreparedStatement ps = conexao.prepareStatement(sqlTotais)) {
        ps.setObject(1, de);
        ps.setObject(2, ate);
        try (ResultSet rs = ps.executeQuery()) {
          rs.next();
          total = rs.getInt("total");
          pagos = rs.getInt("pagos");
          entregues = rs.getInt("entregues");
          subtotal = rs.getBigDecimal("subtotal");
          frete = rs.getBigDecimal("frete");
          desconto = rs.getBigDecimal("desconto");
          faturamento = rs.getBigDecimal("faturamento");
        }
      }

      Map<String, BigDecimal> porMetodo = faturamentoPorMetodo(conexao, de, ate);
      String porMetodoJson = porMetodo.entrySet().stream()
          .map(e -> "\"" + e.getKey() + "\": " + e.getValue())
          .collect(Collectors.joining(", ", "{", "}"));

      String sqlUpsert = """
          INSERT INTO ecommerce.cash_closings
              (closing_date, orders_count, paid_count, delivered_count, subtotal,
               shipping_total, discount_total, gross_revenue, revenue_by_method, generated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, NOW())
          ON CONFLICT (closing_date) DO UPDATE SET
              orders_count = EXCLUDED.orders_count,
              paid_count = EXCLUDED.paid_count,
              delivered_count = EXCLUDED.delivered_count,
              subtotal = EXCLUDED.subtotal,
              shipping_total = EXCLUDED.shipping_total,
              discount_total = EXCLUDED.discount_total,
              gross_revenue = EXCLUDED.gross_revenue,
              revenue_by_method = EXCLUDED.revenue_by_method,
              generated_at = EXCLUDED.generated_at
          RETURNING id
          """;
      UUID fechamentoId;
      try (PreparedStatement ps = conexao.prepareStatement(sqlUpsert)) {
        ps.setObject(1, dia);
        ps.setInt(2, total);
        ps.setInt(3, pagos);
        ps.setInt(4, entregues);
        ps.setBigDecimal(5, subtotal);
        ps.setBigDecimal(6, frete);
        ps.setBigDecimal(7, desconto);
        ps.setBigDecimal(8, faturamento);
        ps.setString(9, porMetodoJson);
        try (ResultSet rs = ps.executeQuery()) {
          rs.next();
          fechamentoId = rs.getObject(1, UUID.class);
        }
      }

      String resumo = "{\"dia\": \"" + dia + "\", \"pedidos\": " + total + ", \"faturamento\": " + faturamento + "}";
      execucoes.sucesso(conexao, NOME, disparadoPor, resumo, inicio);

      return new ResultadoFechamentoCaixa(fechamentoId, dia, total, pagos, entregues,
          subtotal, frete, desconto, faturamento, porMetodo, Instant.now());
    });
  }

  private Map<String, BigDecimal> faturamentoPorMetodo(Connection conexao, OffsetDateTime de, OffsetDateTime ate)
      throws SQLException {
    String sql = """
        SELECT p.method::text AS metodo, SUM(p.amount) AS valor
        FROM ecommerce.payments p
        JOIN ecommerce.orders o ON o.id = p.order_id
        WHERE p.status = 'APPROVED'
          AND o.status IN ('PAID', 'DELIVERED')
          AND o.created_at >= ? AND o.created_at < ?
        GROUP BY p.method
        ORDER BY p.method
        """;
    Map<String, BigDecimal> mapa = new LinkedHashMap<>();
    try (PreparedStatement ps = conexao.prepareStatement(sql)) {
      ps.setObject(1, de);
      ps.setObject(2, ate);
      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          mapa.put(rs.getString("metodo"), rs.getBigDecimal("valor"));
        }
      }
    }
    return mapa;
  }
}
