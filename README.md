# Minhas Finanças — Assistente Financeiro

Dashboard financeiro pessoal, modular e mensal, que roda inteiramente no seu
navegador (HTML + CSS + JavaScript puro, sem build step e sem backend).

## Como usar

Abra `index.html` no navegador (duplo clique) ou sirva a pasta com um servidor
estático simples, por exemplo:

```bash
python3 -m http.server 8080
```

e acesse `http://localhost:8080`.

Na primeira vez, o sistema já vem com um mês de exemplo (Julho/2026),
extraído dos documentos didáticos de extrato bancário e fatura de cartão
anexados. Você pode apagá-lo em **Configurações → Meses com dados**.

## O que o sistema faz

- **Mensal e modular**: cada mês tem seus próprios lançamentos, orçamento e
  saldo inicial. Navegue entre meses pela seta ou crie um novo mês.
- **Importação de PDF**: arraste o extrato bancário ou a fatura de cartão em
  **Importar**. O parser lê o texto do PDF pela posição de cada palavra (via
  [pdf.js](https://mozilla.github.io/pdf.js/), carregado de um CDN) e
  reconstrói as colunas da tabela — o arquivo em si nunca sai do seu
  navegador, só a biblioteca de leitura é baixada uma vez. Sem internet no
  momento da importação, use CSV ou lançamento manual.
- **Importação de CSV**: para bancos que não exportam nesse formato de PDF,
  use um CSV com colunas `Data;Descrição;Valor;Categoria` (modelo disponível
  na própria tela de importação).
- **Lançamento manual**: botão "+ Lançamento" em qualquer tela.
- **Categorização automática**: lançamentos do extrato são classificados por
  CNPJ/palavra-chave; lançamentos do cartão são classificados pelo MCC
  (código do ramo de atividade do estabelecimento) — a mesma lógica sugerida
  nos próprios documentos de exemplo. Você pode reclassificar qualquer
  lançamento clicando na categoria; o sistema memoriza a correção (por CNPJ
  ou MCC) e aplica automaticamente da próxima vez.
- **Detecção de duplicados**: reimportar o mesmo extrato não duplica
  lançamentos.
- **Orçamento por categoria**, **gráficos** (saldo ao longo do mês, despesas
  por categoria, receitas x despesas) e um painel de **observações
  automáticas** (ex.: categoria que mais pesou no mês, comparação com o mês
  anterior, aviso de vencimento de fatura).
- **Backup**: exporte tudo para um `.json` e restaure quando quiser, em
  **Configurações**.

## Privacidade

Todos os dados ficam salvos apenas no `localStorage` do seu navegador. Nada é
enviado para nenhum servidor.

## Estrutura do projeto

```
index.html
css/styles.css        estilos (tema claro/escuro)
js/utils.js            formatação de moeda/data
js/mcc-map.js          MCC → categoria
js/rules.js            categorias e regras de palavra-chave do extrato
js/store.js            persistência em localStorage
js/categorizer.js      motor de categorização (+ regras aprendidas)
js/parsers.js          leitura de PDF (extrato/fatura), CSV e backup JSON
js/analytics.js        agregações por mês (KPIs, séries, rankings)
js/charts.js           gráficos em SVG
js/ui.js               telas do dashboard
js/app.js              inicialização e orquestração
data/seed-2026-07.js   mês de exemplo pré-carregado
```
