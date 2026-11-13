package br.com.ecommercedagalera.retaguarda.server;

import br.com.ecommercedagalera.retaguarda.api.ResultadoConsolidacaoEstoque;
import br.com.ecommercedagalera.retaguarda.api.ResultadoFechamentoCaixa;
import br.com.ecommercedagalera.retaguarda.api.RetaguardaException;
import br.com.ecommercedagalera.retaguarda.api.RetaguardaService;
import br.com.ecommercedagalera.retaguarda.db.Banco;
import br.com.ecommercedagalera.retaguarda.db.RegistroExecucoes;
import br.com.ecommercedagalera.retaguarda.jobs.ConsolidacaoEstoqueJob;
import br.com.ecommercedagalera.retaguarda.jobs.FechamentoCaixaJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;

public class RetaguardaServiceImpl implements RetaguardaService {

    private static final Logger log = LoggerFactory.getLogger(RetaguardaServiceImpl.class);

    private final Banco banco;
    private final RegistroExecucoes execucoes;
    private final ConsolidacaoEstoqueJob estoqueJob;
    private final FechamentoCaixaJob caixaJob;

    public RetaguardaServiceImpl(Banco banco, RegistroExecucoes execucoes,
                                 ConsolidacaoEstoqueJob estoqueJob, FechamentoCaixaJob caixaJob) {
        this.banco = banco;
        this.execucoes = execucoes;
        this.estoqueJob = estoqueJob;
        this.caixaJob = caixaJob;
    }

    @Override
    public String ping() {
        return "retaguarda-rmi ok " + Instant.now();
    }

    @Override
    public ResultadoConsolidacaoEstoque consolidarEstoque(String disparadoPor) throws RetaguardaException {
        String quem = quem(disparadoPor);
        Instant inicio = Instant.now();
        try {
            ResultadoConsolidacaoEstoque r = estoqueJob.executar(quem);
            log.info("consolidacao de estoque ({}): {} produtos, {} corrigidos",
                    quem, r.produtosAnalisados(), r.divergenciasCorrigidas());
            return r;
        } catch (SQLException e) {
            throw falhou(ConsolidacaoEstoqueJob.NOME, quem, inicio, e);
        }
    }

    @Override
    public ResultadoFechamentoCaixa fecharCaixa(LocalDate dia, String disparadoPor) throws RetaguardaException {
        String quem = quem(disparadoPor);
        Instant inicio = Instant.now();
        try {
            ResultadoFechamentoCaixa r = caixaJob.executar(dia, quem);
            log.info("fechamento de caixa {} ({}): {} pedidos, R$ {}",
                    r.dia(), quem, r.totalPedidos(), r.faturamento());
            return r;
        } catch (SQLException e) {
            throw falhou(FechamentoCaixaJob.NOME, quem, inicio, e);
        }
    }

    private String quem(String disparadoPor) {
        return disparadoPor == null || disparadoPor.isBlank() ? "manual" : disparadoPor.trim();
    }

    private RetaguardaException falhou(String job, String quem, Instant inicio, SQLException erro) {
        log.error("falha no job {}", job, erro);
        try {
            banco.emTransacao(quem, conexao -> execucoes.falha(conexao, job, quem, erro.getMessage(), inicio));
        } catch (SQLException e) {
            log.error("nao consegui registrar a falha", e);
        }
        return new RetaguardaException("Falha no job " + job + ": " + erro.getMessage());
    }
}
