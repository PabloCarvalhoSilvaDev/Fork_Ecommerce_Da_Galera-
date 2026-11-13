package br.com.ecommercedagalera.retaguarda.server;

import br.com.ecommercedagalera.retaguarda.config.Config;

public class Main {

    public static void main(String[] args) throws Exception {
        ServidorRmi servidor = new ServidorRmi(Config.carregar());
        Runtime.getRuntime().addShutdownHook(new Thread(servidor::close));
        System.out.println("Servidor RMI no ar. Ctrl+C para parar.");
    }
}
