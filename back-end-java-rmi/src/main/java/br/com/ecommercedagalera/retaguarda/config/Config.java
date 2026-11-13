package br.com.ecommercedagalera.retaguarda.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

public record Config(
    String dbHost,
    int dbPort,
    String dbDatabase,
    String dbUser,
    String dbPassword,
    String rmiHost,
    int rmiRegistryPort,
    int rmiServicePort,
    boolean agendadorAtivo,
    LocalTime horaEstoque,
    LocalTime horaCaixa,
    ZoneId fuso) {

  public static Config carregar() {
    Map<String, String> env = lerEnv(Path.of(".env"));
    return new Config(
        get(env, "DB_HOST", "localhost"),
        Integer.parseInt(get(env, "DB_PORT", "5432")),
        get(env, "DB_DATABASE", "ecommerce"),
        get(env, "DB_USER", "svc_java_rmi"),
        get(env, "DB_PASSWORD", ""),
        get(env, "RMI_HOST", "localhost"),
        Integer.parseInt(get(env, "RMI_REGISTRY_PORT", "1099")),
        Integer.parseInt(get(env, "RMI_SERVICE_PORT", "1100")),
        Boolean.parseBoolean(get(env, "RMI_SCHEDULER_ENABLED", "true")),
        LocalTime.parse(get(env, "RMI_STOCK_CRON_TIME", "02:00")),
        LocalTime.parse(get(env, "RMI_CASH_CRON_TIME", "23:55")),
        ZoneId.of(get(env, "RMI_TIMEZONE", "America/Sao_Paulo")));
  }

  private static String get(Map<String, String> env, String chave, String padrao) {
    String v = System.getenv(chave);
    if (v != null && !v.isBlank()) {
      return v.trim();
    }
    return env.getOrDefault(chave, padrao);
  }

  private static Map<String, String> lerEnv(Path caminho) {
    Map<String, String> valores = new HashMap<>();
    if (!Files.isRegularFile(caminho)) {
      return valores;
    }
    try {
      for (String linha : Files.readAllLines(caminho)) {
        linha = linha.trim();
        int i = linha.indexOf('=');
        if (linha.startsWith("#") || i <= 0) {
          continue;
        }
        valores.put(linha.substring(0, i).trim(), linha.substring(i + 1).trim());
      }
    } catch (IOException e) {
      throw new IllegalStateException("erro ao ler .env", e);
    }
    return valores;
  }
}
