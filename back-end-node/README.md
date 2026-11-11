# Back-end Node.js

API Express em TypeScript para o serviço Node da loja. O cadastro de cliente segue a seção 2.2 do SRS e persiste em `ecommerce.users` do PostgreSQL compartilhado.

## Cadastro de cliente

`POST /auth/register` recebe JSON:

```json
{
  "fullName": "Nome do cliente",
  "email": "cliente@exemplo.com",
  "password": "senha-com-pelo-menos-8",
  "confirmPassword": "senha-com-pelo-menos-8",
  "documentNumber": "12345678900",
  "phone": "+5511999999999"
}
```

`phone` pode ser omitido. CPF/CNPJ pode ser enviado com pontuação e é persistido somente com dígitos. O serviço valida os campos, calcula o hash BCrypt e insere explicitamente o papel `CLIENTE`; não aceita campos adicionais como `role`. O e-mail e o documento são protegidos também pelas constraints do banco.

Em caso de sucesso, responde `201` com `{ "user": { ... }, "token": "..." }`. O JWT inclui `sub` com o UUID do cliente, `role: "CLIENTE"` e `context: "STORE"`. Dados inválidos retornam `400`, e conflito de e-mail/documento retorna `409`.

## Executar

1. Use Node.js 22 ou superior.
2. Copie `.env.example` para `.env` e configure a conexão PostgreSQL, uma `JWT_SECRET` aleatória com pelo menos 32 caracteres e as origens Angular em `CORS_ORIGIN` (separadas por vírgula).
3. Crie o banco aplicando o `schema.db` da raiz. A conta da aplicação deve ter apenas os privilégios necessários para o serviço.
4. Instale e execute:

```powershell
npm install
npm run dev
```

A API verifica a conexão com PostgreSQL ao iniciar e escuta na porta `PORT` (3000 por padrão). Para compilar e executar em produção, use `npm run build` e `npm start`. `npm test` executa os testes de validação do cadastro.

Se o schema já estiver instalado, aplique `src/database/001-redact-password-hash-from-audit.sql` antes de aceitar cadastros. O trigger registra as alterações dos usuários sem incluir `password_hash` nos novos snapshots; essa alteração não remove hashes que eventualmente já estejam em logs antigos.

## Limites entre serviços

- O Node é o emissor de JWT; checkout/pedidos pertencem ao Java e o painel administrativo ao PHP/Laravel.
- O Angular consome as APIs Node de autenticação e catálogo; o carrinho permanece no Angular.
- `schema.db` é compartilhado pelos serviços. Mudanças e permissões de banco precisam ser coordenadas entre as equipes.
