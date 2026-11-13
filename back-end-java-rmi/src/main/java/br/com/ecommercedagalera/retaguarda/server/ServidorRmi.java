package br.com.ecommercedagalera.retaguarda.server;

import br.com.ecommercedagalera.retaguarda.api.RetaguardaService;
import br.com.ecommercedagalera.retaguarda.config.Config;
import br.com.ecommercedagalera.retaguarda.db.Banco;
import br.com.ecommercedagalera.retaguarda.db.RegistroExecucoes;
import br.com.ecommercedagalera.retaguarda.jobs.Agendador;
import br.com.ecommercedagalera.retaguarda.jobs.ConsolidacaoEstoqueJob;
import br.com.ecommercedagalera.retaguarda.jobs.FechamentoCaixaJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.rmi.NoSuchObjectException;
import java.rmi.Remote;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;

public class ServidorRmi implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(ServidorRmi.class);

    private final Banco banco;
    private final Agendador agendador;
    private final RetaguardaServiceImpl servico;
    private final Registry registry;

    public ServidorRmi(Config config) throws RemoteException {
        System.setProperty("java.rmi.server.hostname", config.rmiHost());

        banco = new Banco(config);
        RegistroExecucoes execucoes = new RegistroExecucoes();
        ConsolidacaoEstoqueJob estoqueJob = new ConsolidacaoEstoqueJob(banco, execucoes);
        FechamentoCaixaJob caixaJob = new FechamentoCaixaJob(banco, execucoes, config.fuso());
        servico = new RetaguardaServiceImpl(banco, execucoes, estoqueJob, caixaJob);

        Remote stub = UnicastRemoteObject.exportObject(servico, config.rmiServicePort());
        registry = LocateRegistry.createRegistry(config.rmiRegistryPort());
        registry.rebind(RetaguardaService.NOME, stub);
        log.info("servico '{}' publicado em {}:{}", RetaguardaService.NOME, config.rmiHost(), config.rmiRegistryPort());

        agendador = new Agendador(config.fuso());
        if (config.agendadorAtivo()) {
            agendador.todoDiaAs(config.horaEstoque(), ConsolidacaoEstoqueJob.NOME,
                    () -> servico.consolidarEstoque("cron"));
            agendador.todoDiaAs(config.horaCaixa(), FechamentoCaixaJob.NOME,
                    () -> servico.fecharCaixa(null, "cron"));
        }
    }

    @Override
    public void close() {
        agendador.close();
        try {
            registry.unbind(RetaguardaService.NOME);
            UnicastRemoteObject.unexportObject(servico, true);
            UnicastRemoteObject.unexportObject(registry, true);
        } catch (NoSuchObjectException | java.rmi.NotBoundException e) {
        } catch (RemoteException e) {
            log.warn("erro ao parar o rmi", e);
        }
        banco.close();
    }
}
