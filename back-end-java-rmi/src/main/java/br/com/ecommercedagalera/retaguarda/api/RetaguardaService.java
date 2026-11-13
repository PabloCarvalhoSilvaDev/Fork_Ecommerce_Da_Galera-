package br.com.ecommercedagalera.retaguarda.api;

import java.rmi.Remote;
import java.rmi.RemoteException;
import java.time.LocalDate;

public interface RetaguardaService extends Remote {

  String NOME = "RetaguardaService";

  String ping() throws RemoteException;

  ResultadoConsolidacaoEstoque consolidarEstoque(String disparadoPor)
      throws RemoteException, RetaguardaException;

  ResultadoFechamentoCaixa fecharCaixa(LocalDate dia, String disparadoPor)
      throws RemoteException, RetaguardaException;
}
