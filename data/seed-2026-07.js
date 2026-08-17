/* Dados de exemplo pré-carregados: extraídos dos documentos fictícios
   "Extrato bancário Julho/2026" e "Fatura do cartão Julho/2026" (Banco Horizonte S.A.).
   Servem para você ver o dashboard funcionando com dados reais desde o primeiro acesso.
   Você pode apagar este mês em Configurações > Dados quando importar os seus. */
window.FA = window.FA || {};

FA.SEED_2026_07 = {
  month: "2026-07",
  openingBalance: 3420.55,
  bank: [
    { date: "2026-07-01", description: "PIX IMOB SANTA CLARA - ALUGUEL JUL/26", bankType: "PIX ENVIADO", doc: "18.442.907/0001-56", amount: -2300.00 },
    { date: "2026-07-02", description: "DEB AUT CONDOMINIO EDIF AURORA", bankType: "DEB AUTOMATICO", doc: "07.331.204/0001-18", amount: -480.00 },
    { date: "2026-07-03", description: "DEB AUT VIVO FIBRA INTERNET 300MB", bankType: "DEB AUTOMATICO", doc: "02.449.992/0001-64", amount: -129.90 },
    { date: "2026-07-05", description: "CREDITO SALARIO - NOVA MIDIA LTDA", bankType: "CREDITO TED", doc: "31.775.610/0001-92", amount: 8450.00 },
    { date: "2026-07-06", description: "DEB AUT ENEL DISTRIBUICAO ENERGIA", bankType: "DEB AUTOMATICO", doc: "61.695.227/0001-93", amount: -187.42 },
    { date: "2026-07-07", description: "COMPRA DEBITO SUPERMERCADO DIA", bankType: "COMPRA DEBITO", doc: "03.476.811/0042-07", amount: -142.88 },
    { date: "2026-07-08", description: "PAGTO FATURA CARTAO FINAL 4417", bankType: "PAGTO FATURA", doc: "60.746.948/0001-12", amount: -2187.43 },
    { date: "2026-07-10", description: "DEB AUT SMARTFIT ACADEMIA", bankType: "DEB AUTOMATICO", doc: "12.547.716/0088-40", amount: -119.90 },
    { date: "2026-07-11", description: "SAQUE TERMINAL 24H AG 0412", bankType: "SAQUE", doc: "", amount: -200.00 },
    { date: "2026-07-14", description: "PIX CULTURA INGLESA - MENSALIDADE", bankType: "PIX ENVIADO", doc: "44.902.316/0001-77", amount: -420.00 },
    { date: "2026-07-15", description: "COMPRA DEBITO POSTO IPIRANGA", bankType: "COMPRA DEBITO", doc: "33.000.167/1102-83", amount: -160.00 },
    { date: "2026-07-17", description: "DEB AUT UNIMED PLANO DE SAUDE", bankType: "DEB AUTOMATICO", doc: "43.202.472/0001-30", amount: -689.00 },
    { date: "2026-07-18", description: "PIX RECEBIDO ESTUDIO ORBITA", bankType: "PIX RECEBIDO", doc: "29.118.554/0001-05", amount: 1200.00 },
    { date: "2026-07-20", description: "COMPRA DEBITO DROGASIL FL 221", bankType: "COMPRA DEBITO", doc: "61.585.865/0221-49", amount: -73.50 },
    { date: "2026-07-22", description: "PIX CLEUSA M SANTOS - DIARISTA", bankType: "PIX ENVIADO", doc: "***.907.221-**", amount: -180.00 },
    { date: "2026-07-24", description: "DEB AUT PORTO SEGURO - SEG AUTO", bankType: "DEB AUTOMATICO", doc: "61.198.164/0001-60", amount: -245.60 },
    { date: "2026-07-25", description: "COMPRA DEBITO PET SHOP AMIGO FIEL", bankType: "COMPRA DEBITO", doc: "22.640.913/0001-24", amount: -134.00 },
    { date: "2026-07-28", description: "PIX RENATA C RIBEIRO - PRESENTE", bankType: "PIX ENVIADO", doc: "***.554.180-**", amount: -150.00 },
    { date: "2026-07-29", description: "TARIFA PACOTE DE SERVICOS CONTA FACIL", bankType: "TARIFA", doc: "60.746.948/0001-12", amount: -34.90 },
    { date: "2026-07-30", description: "CREDITO RENDIMENTO CDB LIQUIDEZ DIARIA", bankType: "RENDIMENTO", doc: "60.746.948/0001-12", amount: 42.18 },
    { date: "2026-07-31", description: "PIX CONTA INVESTIMENTO - RESERVA", bankType: "PIX ENVIADO", doc: "60.746.948/0001-12", amount: -1000.00 }
  ],
  card: {
    cardLast4: "4417",
    closingDate: "2026-07-28",
    dueDate: "2026-08-08",
    previousBalance: 2187.43,
    creditLimit: 12000.00,
    purchases: [
      { date: "2026-07-01", merchant: "IFOOD *RESTAURANTE MASSA NOSTRA", mcc: "5812", activity: "Restaurantes e lanchonetes", city: "SAO PAULO", amount: 68.90 },
      { date: "2026-07-02", merchant: "POSTO IPIRANGA JD PAULISTA", mcc: "5541", activity: "Postos de combustivel", city: "SAO PAULO", amount: 210.00 },
      { date: "2026-07-02", merchant: "NETFLIX.COM ASSINATURA MENSAL", mcc: "4899", activity: "TV por assinatura e streaming", city: "INTERNET", amount: 44.90 },
      { date: "2026-07-03", merchant: "DROGARIA SAO PAULO FL 118", mcc: "5912", activity: "Farmacias e drogarias", city: "SAO PAULO", amount: 87.45 },
      { date: "2026-07-04", merchant: "AMAZON BR MARKETPLACE", mcc: "5999", activity: "Varejo diverso", city: "INTERNET", amount: 156.80 },
      { date: "2026-07-05", merchant: "SUPERMERCADO PAO DE ACUCAR 1042", mcc: "5411", activity: "Supermercados e mercearias", city: "SAO PAULO", amount: 432.17 },
      { date: "2026-07-07", merchant: "SPOTIFY BR PREMIUM", mcc: "5735", activity: "Musica e midia digital", city: "INTERNET", amount: 21.90 },
      { date: "2026-07-09", merchant: "UBER *TRIP HELP.UBER.COM", mcc: "4121", activity: "Taxi e transporte por app", city: "SAO PAULO", amount: 32.40 },
      { date: "2026-07-10", merchant: "OUTBACK STEAKHOUSE MORUMBI", mcc: "5812", activity: "Restaurantes e lanchonetes", city: "SAO PAULO", amount: 189.60 },
      { date: "2026-07-12", merchant: "LIVRARIA CULTURA CONJ NACIONAL", mcc: "5942", activity: "Livrarias", city: "SAO PAULO", amount: 94.00 },
      { date: "2026-07-13", merchant: "UBER *TRIP HELP.UBER.COM", mcc: "4121", activity: "Taxi e transporte por app", city: "SAO PAULO", amount: 28.70 },
      { date: "2026-07-15", merchant: "MAGAZINE LUIZA PARC 1/3", mcc: "5722", activity: "Eletrodomesticos", city: "SAO PAULO", amount: 133.30 },
      { date: "2026-07-16", merchant: "PADARIA BELLA MASSA", mcc: "5462", activity: "Padarias e confeitarias", city: "SAO PAULO", amount: 46.20 },
      { date: "2026-07-18", merchant: "POSTO SHELL SELECT PINHEIROS", mcc: "5541", activity: "Postos de combustivel", city: "SAO PAULO", amount: 195.00 },
      { date: "2026-07-20", merchant: "CINEMARK SHOPPING ELDORADO", mcc: "7832", activity: "Cinemas", city: "SAO PAULO", amount: 78.00 },
      { date: "2026-07-21", merchant: "SUPERMERCADO EXTRA HIPER 305", mcc: "5411", activity: "Supermercados e mercearias", city: "SAO PAULO", amount: 288.55 },
      { date: "2026-07-23", merchant: "FARMACIA PAGUE MENOS 0871", mcc: "5912", activity: "Farmacias e drogarias", city: "SAO PAULO", amount: 62.30 },
      { date: "2026-07-24", merchant: "APPLE.COM/BILL ICLOUD", mcc: "5735", activity: "Musica e midia digital", city: "INTERNET", amount: 9.90 },
      { date: "2026-07-26", merchant: "IFOOD *LANCHONETE DO ZE", mcc: "5812", activity: "Restaurantes e lanchonetes", city: "SAO PAULO", amount: 54.80 },
      { date: "2026-07-27", merchant: "DECATHLON MORUMBI", mcc: "5655", activity: "Artigos esportivos", city: "SAO PAULO", amount: 219.90 }
    ]
  }
};
