package br.com.ecommercedagalera.retaguarda.db;

import br.com.ecommercedagalera.retaguarda.config.Config;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class Banco implements AutoCloseable {

  private final HikariDataSource dataSource;

  public Banco(Config config) {
    HikariConfig hikari = new HikariConfig();
    hikari.setJdbcUrl("jdbc:postgresql://" + config.dbHost() + ":" + config.dbPort() + "/" + config.dbDatabase());
    hikari.setUsername(config.dbUser());
    hikari.setPassword(config.dbPassword());
    hikari.addDataSourceProperty("ApplicationName", "rmi");
    hikari.setMaximumPoolSize(4);
    hikari.setAutoCommit(false);
    this.dataSource = new HikariDataSource(hikari);
  }

  public interface Trabalho<T> {
    T executar(Connection conexao) throws SQLException;
  }

  public <T> T emTransacao(String disparadoPor, Trabalho<T> trabalho) throws SQLException {
    try (Connection conexao = dataSource.getConnection()) {
      try {
        try (PreparedStatement ps = conexao.prepareStatement(
            "SELECT set_config('app.current_user_id', ?, true)")) {
          ps.setString(1, disparadoPor);
          ps.execute();
        }
        T resultado = trabalho.executar(conexao);
        conexao.commit();
        return resultado;
      } catch (SQLException | RuntimeException e) {
        conexao.rollback();
        throw e;
      }
    }
  }

  @Override
  public void close() {
    dataSource.close();
  }
}
