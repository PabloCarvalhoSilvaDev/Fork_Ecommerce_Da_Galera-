import { Routes } from '@angular/router';
import { exigeLogin } from './core/sessao/exige-login';
import { Autenticacao } from './layout/autenticacao/autenticacao';
import { Principal } from './layout/principal/principal';

/**
 * As rotas seguem as do back-end/SRS (ex.: o login do Node devolve
 * `redirectTo: "/catalog/home"` e `"/auth/context"`). Ao criar tela nova,
 * use o caminho da tabela de rotas do SRS.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog/home',
  },
  {
    path: '',
    component: Principal,
    children: [
      {
        path: 'catalog/home',
        title: 'Vitrine',
        loadComponent: () => import('./features/catalogo/vitrine/vitrine').then((m) => m.Vitrine),
      },
      {
        path: 'catalog/search',
        title: 'Busca',
        loadComponent: () => import('./features/catalogo/busca/busca').then((m) => m.Busca),
      },
      {
        path: 'catalog/product/:slug',
        title: 'Detalhes do Produto',
        loadComponent: () =>
          import('./features/catalogo/detalhe-produto/detalhe-produto').then(
            (m) => m.DetalheProduto,
          ),
      },
      {
        path: 'checkout/cart',
        title: 'Carrinho de Compras',
        loadComponent: () =>
          import('./features/checkout/carrinho/carrinho').then((m) => m.Carrinho),
      },
      {
        path: 'checkout/address',
        canActivate: [exigeLogin],
        title: 'Endereço de Entrega',
        loadComponent: () =>
          import('./features/checkout/endereco/endereco').then((m) => m.Endereco),
      },
      {
        path: 'checkout/payment',
        canActivate: [exigeLogin],
        title: 'Pagamento',
        loadComponent: () =>
          import('./features/checkout/pagamento/pagamento').then((m) => m.Pagamento),
      },
      {
        path: 'checkout/success/:orderId',
        canActivate: [exigeLogin],
        title: 'Confirmação de Compra',
        loadComponent: () =>
          import('./features/checkout/confirmacao/confirmacao').then((m) => m.Confirmacao),
      },
      {
        path: 'account/orders',
        canActivate: [exigeLogin],
        title: 'Meus Pedidos',
        loadComponent: () => import('./features/pedidos/lista/lista').then((m) => m.Lista),
      },
      {
        path: 'account/orders/:orderId',
        canActivate: [exigeLogin],
        title: 'Detalhes do Pedido',
        loadComponent: () => import('./features/pedidos/detalhe/detalhe').then((m) => m.Detalhe),
      },
    ],
  },
  {
    path: 'auth',
    component: Autenticacao,
    children: [
      {
        path: 'register',
        title: 'Cadastro de Cliente',
        loadComponent: () =>
          import('./features/autenticacao/cadastro-cliente/cadastro-cliente').then(
            (m) => m.CadastroCliente,
          ),
      },
      {
        path: 'login',
        title: 'Login',
        loadComponent: () => import('./features/autenticacao/login/login').then((m) => m.Login),
      },
      {
        path: 'forgot',
        title: 'Esqueci a Senha',
        loadComponent: () =>
          import('./features/autenticacao/esqueci-senha/esqueci-senha').then((m) => m.EsqueciSenha),
      },
      {
        path: 'reset/:token',
        title: 'Redefinir Senha',
        loadComponent: () =>
          import('./features/autenticacao/redefinir-senha/redefinir-senha').then(
            (m) => m.RedefinirSenha,
          ),
      },
      {
        path: 'context',
        title: 'Escolha de Contexto',
        loadComponent: () =>
          import('./features/autenticacao/escolha-contexto/escolha-contexto').then(
            (m) => m.EscolhaContexto,
          ),
      },
    ],
  },
  {
    // O e-mail de recuperação do back aponta para /redefinir-senha?token=...
    path: 'redefinir-senha',
    redirectTo: ({ queryParams }) =>
      `/auth/reset/${encodeURIComponent(queryParams['token'] ?? '')}`,
  },
  {
    path: '**',
    redirectTo: 'catalog/home',
  },
];
