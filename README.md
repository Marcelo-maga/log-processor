# log-processor - Documentacao Operacional

## 1. Visao geral do sistema

O sistema processa arquivos de log no formato NDJSON, persiste os registros em PostgreSQL e expoe relatorios CSV agregados por consumidor, servico e latencia media.

Arquitetura em alto nivel:
- API HTTP em NestJS com endpoints para ingestao e consulta de relatorios.
- Camada de aplicacao com casos de uso de processamento e geracao de relatorios.
- Persistencia via Prisma + PostgreSQL.
- Leitura de arquivo NDJSON e serializacao CSV.

Responsabilidades principais:
- Ler logs de arquivo NDJSON linha a linha.
- Converter cada linha para entidade de dominio.
- Persistir em lote no banco.
- Gerar relatorios CSV por agregacao no banco.

## 2. Estrutura do sistema

### 2.1 Entradas HTTP

- POST /reader
  - Processa um arquivo NDJSON indicado no corpo da requisicao.
  - Corpo esperado: { "filepath": "/usr/src/app/log_files/logs.txt" }
  - Retorno: 204 No Content em sucesso.

- GET /reports/consumer
  - Retorna CSV com total de requisicoes por consumidor.

- GET /reports/service
  - Retorna CSV com total de requisicoes por servico.

- GET /reports/latency
  - Retorna CSV com medias de latencia por servico.

- GET /docs
  - Documentacao Swagger gerada em runtime.

### 2.2 Camada de aplicacao

- ProcessLogFileUseCase
  - Leitura do arquivo NDJSON.
  - Parse JSON linha a linha.
  - Persistencia em lote (batch size = 500).

- CreateConsumerReportUseCase
  - Consulta agregada por consumidor e serializa CSV.

- CreateServiceReportUseCase
  - Consulta agregada por servico e serializa CSV.

- CreateAvgLatencyReportUseCase
  - Consulta agregada por latencias medias e serializa CSV.

### 2.3 Persistencia

- Prisma + Postgres.
- Tabela principal: ApiGatewayLog.
- Indices em consumerId e serviceName.

### 2.4 Fluxo de dados

1) Cliente envia POST /reader com o caminho do arquivo NDJSON.
2) O leitor de arquivo percorre cada linha valida do arquivo.
3) Cada linha e mapeada para a entidade GatewayLog.
4) Os registros sao persistidos em lote no Postgres.
5) Cliente acessa /reports/* para gerar CSV com dados agregados.

## 3. Comandos operacionais

### 3.1 Instalacao de dependencias

- Proposito: instalar dependencias Node.js.
- Comando:

```bash
npm install
```

- Resultado esperado: node_modules criado e pacotes instalados.
- Falhas comuns:
  - Erros de rede ou permissao no npm.
  - Versao de Node incompativel (verifique a imagem Docker ou seu Node local).

### 3.2 Build (compilacao)

- Proposito: compilar TypeScript para JavaScript em dist/.
- Comando:

```bash
npm run build
```

- Resultado esperado: pasta dist/ com arquivos compilados.
- Falhas comuns:
  - Erros de TypeScript por tipos invalidos.
  - Falta de variaveis de ambiente exigidas por Prisma em tempo de build.

### 3.3 Executar em desenvolvimento (local)

- Proposito: iniciar a API com recarregamento automatico.
- Comando:

```bash
npm run start:dev
```

- Resultado esperado: API ouvindo em PORT (padrao 3000).
- Falhas comuns:
  - DATABASE_URL ausente (o Prisma exige essa variavel).
  - Porta 3000 em uso.

### 3.4 Executar em producao (local)

- Proposito: executar o build compilado.
- Comandos:

```bash
npm run build
npm run start:prod
```

- Resultado esperado: API ouvindo em PORT (padrao 3000) usando dist/.
- Falhas comuns:
  - dist/ ausente (build nao executado).
  - DATABASE_URL ausente.

### 3.5 Executar via Docker Compose

- Proposito: subir API + Postgres com configuracao padrao.
- Comando:

```bash
docker compose up --build
```

- Resultado esperado:
  - Container postgres_db com banco logs_reports.
  - Container logs-melhor-envio-api em modo dev.
- Comportamento:
  - Ao iniciar o container, roda: npx prisma migrate deploy && npm run start:dev
- Falhas comuns:
  - Porta 3000 ou 5432 em uso.
  - Falha no healthcheck do Postgres.

### 3.6 Migracoes Prisma

- Proposito: aplicar migracoes no banco.
- Comando:

```bash
npx prisma migrate deploy
```

- Resultado esperado: migracoes aplicadas e tabela _prisma_migrations atualizada.
- Falhas comuns:
  - DATABASE_URL invalida.
  - Banco indisponivel.

### 3.7 Testes

- Proposito: executar testes unitarios.
- Comando:

```bash
npm run test
```

- Resultado esperado: testes .spec.ts em src/.
- Falhas comuns:
  - Dependencias ausentes.
  - Erros de tipagem ou mocks incorretos.

- Proposito: executar testes e2e.
- Comando:

```bash
npm run test:e2e
```

- Resultado esperado: testes em test/.
- Falhas comuns:
  - Banco ou dependencias externas nao configuradas.

### 3.8 Debug

- Proposito: iniciar servidor com debug.
- Comando:

```bash
npm run start:debug
```

- Resultado esperado: processo com debug habilitado.
- Falhas comuns:
  - Porta de debug em uso.

## 4. Uso operacional

### 4.1 Processar arquivo de logs

- Proposito: persistir logs NDJSON.
- Endpoint:
  - POST /reader
- Exemplo de corpo:
  - { "filepath": "/usr/src/app/log_files/logs.txt" }
- Resultado esperado:
  - HTTP 204 sem conteudo.
- Falhas comuns:
  - Caminho invalido ou arquivo inacessivel.
  - Linhas invalidas em JSON (sao ignoradas com warn no log).

### 4.2 Gerar relatorios CSV

- Proposito: baixar CSVs agregados.
- Endpoints:
  - GET /reports/consumer -> consumers.csv
  - GET /reports/service -> services.csv
  - GET /reports/latency -> avg.csv
- Resultado esperado:
  - Resposta text/csv com arquivo para download.
- Falhas comuns:
  - Banco sem dados processados.
  - Erro de conexao com o banco.

## 5. Manutencao e observacoes

- A variavel de ambiente DATABASE_URL e obrigatoria para iniciar a aplicacao.
- O processamento de arquivo usa batch de 500 registros para gravacao.
- Linhas invalidas em JSON sao descartadas e registradas em log.
- O caminho do arquivo deve ser acessivel pelo processo (no Docker, use /usr/src/app/log_files).
- Nao ha passos de deploy definidos no repositorio alem do Dockerfile e docker-compose.
- Informacoes sobre autenticacao, autorizacao ou limites de rate nao estao presentes no codigo atual.