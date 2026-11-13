package br.com.ecommercedagalera.retaguarda.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

public class RegistroExecucoes {

  private static final String SQL = """
      INSERT INTO ecommerce.rmi_job_runs (job_name, status, triggered_by, summary, error_message, started_at)
      VALUES (?, ?, ?, ?::jsonb, ?, ?)
      RETURNING id
      """;

  public UUID sucesso(Connection conexao, String job, String disparadoPor, String resumoJson, Instant inicio)
      throws SQLException {
    return inserir(conexao, job, "SUCCESS", disparadoPor, resumoJson, null, inicio);
  }

  public UUID falha(Connection conexao, String job, String disparadoPor, String erro, Instant inicio)
      throws SQLException {
    return inserir(conexao, job, "FAILED", disparadoPor, "{}", erro, inicio);
  }

  private UUID inserir(Connection conexao, String job, String status, String disparadoPor,
      String resumoJson, String erro, Instant inicio) throws SQLException {
    try (PreparedStatement ps = conexao.prepareStatement(SQL)) {
      ps.setString(1, job);
      ps.setString(2, status);
      ps.setString(3, disparadoPor);
      ps.setString(4, resumoJson);
      ps.setString(5, erro);
      ps.setTimestamp(6, Timestamp.from(inicio));
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        return rs.getObject(1, UUID.class);
      }
    }
  }
}
