import { Routes } from '@angular/router';
import { Autenticacao } from './layout/autenticacao/autenticacao';
import { Principal } from './layout/principal/principal';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cadastro-cliente',
  },
  {
    path: '',
    component: Principal,
    children: [
      {
        path: 'busca',
        title: 'Busca',
        loadComponent: () => import('./features/catalogo/busca/busca').then((m) => m.Busca),
      },
      {
        path: 'detalhe-produto',
        title: 'Detalhes do Produto',
        loadComponent: () =>
          import('./features/catalogo/detalhe-produto/detalhe-produto').then(
            (m) => m.DetalheProduto,
          ),
      },
      {
        path: 'vitrine',
        title: 'Vitrine',
        loadComponent: () => import('./features/catalogo/vitrine/vitrine').then((m) => m.Vitrine),
      },
      {
        path: 'carrinho',
        title: 'Carrinho de Compras',
        loadComponent: () =>
          import('./features/checkout/carrinho/carrinho').then((m) => m.Carrinho),
      },
      {
        path: 'confirmacao',
        title: 'Confirmação de Compra',
        loadComponent: () =>
          import('./features/checkout/confirmacao/confirmacao').then((m) => m.Confirmacao),
      },
      {
        path: 'endereco',
        title: 'Endereço de Entrega',
        loadComponent: () =>
          import('./features/checkout/endereco/endereco').then((m) => m.Endereco),
      },
      {
        path: 'pagamento',
        title: 'Pagamento',
        loadComponent: () =>
          import('./features/checkout/pagamento/pagamento').then((m) => m.Pagamento),
      },
      {
        path: 'detalhes-pedido',
        title: 'Detalhes do Pedido',
        loadComponent: () => import('./features/pedidos/detalhe/detalhe').then((m) => m.Detalhe),
      },
      {
        path: 'lista-pedidos',
        title: 'Lista de Pedidos',
        loadComponent: () => import('./features/pedidos/lista/lista').then((m) => m.Lista),
      },
    ],
  },
  {
    path: '',
    component: Autenticacao,
    children: [
      {
        path: 'cadastro-cliente',
        title: 'Cadastro de Cliente',
        loadComponent: () =>
          import('./features/autenticacao/cadastro-cliente/cadastro-cliente').then(
            (m) => m.CadastroCliente,
          ),
      },
      {
        path: 'Login',
        title: 'Login',
        loadComponent: () => import('./features/autenticacao/login/login').then((m) => m.Login),
      },
      {
        path: 'esqueci-senha',
        title: 'Esqueci a Senha',
        loadComponent: () =>
          import('./features/autenticacao/esqueci-senha/esqueci-senha').then((m) => m.EsqueciSenha),
      },
      {
        path: 'redefinir-senha',
        title: 'Redefinir Senha',
        loadComponent: () =>
          import('./features/autenticacao/redefinir-senha/redefinir-senha').then(
            (m) => m.RedefinirSenha,
          ),
      },
      {
        path: 'escolha-contexto',
        title: 'Escolha de Contexto',
        loadComponent: () =>
          import('./features/autenticacao/escolha-contexto/escolha-contexto').then(
            (m) => m.EscolhaContexto,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'cadastro-cliente',
  },
];
