package br.com.ecommercedagalera.retaguarda.api;

public class RetaguardaException extends Exception {

  private static final long serialVersionUID = 1L;

  public RetaguardaException(String mensagem) {
    super(mensagem);
  }
}
