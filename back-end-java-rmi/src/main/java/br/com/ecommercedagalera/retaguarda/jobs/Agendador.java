package br.com.ecommercedagalera.retaguarda.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Agendador implements AutoCloseable {

  private static final Logger log = LoggerFactory.getLogger(Agendador.class);

  private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
  private final ZoneId fuso;

  public Agendador(ZoneId fuso) {
    this.fuso = fuso;
  }

  public interface Tarefa {
    void rodar() throws Exception;
  }

  public void todoDiaAs(LocalTime hora, String nome, Tarefa tarefa) {
    ZonedDateTime agora = ZonedDateTime.now(fuso);
    ZonedDateTime proxima = agora.with(hora);
    if (!proxima.isAfter(agora)) {
      proxima = proxima.plusDays(1);
    }
    long espera = Duration.between(agora, proxima).toSeconds();

    executor.scheduleAtFixedRate(() -> {
      try {
        log.info("cron: rodando {}", nome);
        tarefa.rodar();
      } catch (Exception e) {
        log.error("cron: falha em {}", nome, e);
      }
    }, espera, TimeUnit.DAYS.toSeconds(1), TimeUnit.SECONDS);
    log.info("{} agendado para {} todo dia", nome, hora);
  }

  @Override
  public void close() {
    executor.shutdownNow();
  }
}
