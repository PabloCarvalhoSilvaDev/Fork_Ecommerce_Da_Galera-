# Back-end Node.js

Estrutura reservada ao serviço Node.js da loja. Este diretório contém apenas a organização inicial; a aplicação Express, dependências e endpoints ainda não foram implementados.

## Responsabilidades previstas

- **Autenticação e identidade:** cadastro de clientes, login, recuperação de senha, sessão e emissão de JWT.
- **Catálogo:** vitrine, busca e detalhes públicos de produtos.
- **Tempo real:** receber notificações internas de mudança de status e distribuí-las aos clientes autorizados.

O Node será o único emissor dos JWT, conforme o SRS. Claims, assinatura, chaves e contratos HTTP ainda precisam ser alinhados com as equipes Java e PHP antes de implementar os serviços consumidores.

## Limites entre serviços

- O Angular consumirá futuramente as APIs Node para autenticação e catálogo. O carrinho permanece no Angular.
- Checkout, criação de pedidos e pagamento pertencem ao serviço Java; o Angular enviará os pedidos diretamente a ele.
- O painel administrativo pertence ao PHP/Laravel. Ao alterar um pedido, o PHP notificará o Node pelo endpoint interno acordado; o Node publicará a atualização em tempo real para a tela de pedidos Angular.
- `schema.db` é o script PostgreSQL compartilhado entre os serviços. Credenciais, permissões e possíveis mudanças no schema devem ser coordenadas e configuradas fora do código.

## Organização

```text
src/
├── app/          # composição futura da aplicação e rotas HTTP
├── config/       # configuração futura por ambiente
├── database/     # conexão e acesso futuro ao PostgreSQL
├── middleware/   # autenticação, validação e erros HTTP
├── modules/
│   ├── auth/     # identidade, sessão e JWT
│   ├── catalog/  # vitrine, busca e detalhes
│   └── realtime/ # integração interna e WebSocket de status
└── shared/       # tipos, erros e utilidades realmente comuns
```

As pastas ainda não implementam lógica. A próxima etapa será definir os contratos de API e autenticação com os serviços Java/PHP e, então, adicionar a base executável do Node.
