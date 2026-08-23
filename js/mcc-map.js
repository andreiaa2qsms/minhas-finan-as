/* Mapa de MCC (Merchant Category Code) para categoria interna.
   O MCC é o caminho mais confiável para categorizar compras de cartão:
   o nome do estabelecimento varia, o MCC é padronizado pela bandeira. */
window.FA = window.FA || {};

FA.MCC_MAP = {
  // Alimentação
  "5411": "alimentacao", // Supermercados e mercearias
  "5422": "alimentacao", // Açougues
  "5441": "alimentacao", // Doces e balas
  "5451": "alimentacao", // Laticínios
  "5462": "alimentacao", // Padarias e confeitarias
  "5499": "alimentacao", // Mercearias diversas
  "5812": "alimentacao", // Restaurantes e lanchonetes
  "5813": "lazer",       // Bares e casas noturnas
  "5814": "alimentacao", // Fast food

  // Transporte
  "4111": "transporte", // Transporte urbano
  "4121": "transporte", // Táxi e transporte por app
  "4131": "transporte", // Ônibus
  "4468": "transporte",  // Marinas
  "5013": "transporte",  // Peças e acessórios de veículos
  "5541": "transporte", // Postos de combustível
  "5542": "transporte", // Postos automatizados
  "7523": "transporte", // Estacionamentos e garagens
  "7531": "transporte",  // Oficinas mecânicas
  "7538": "transporte",  // Serviços automotivos gerais
  "4511": "outros",      // Companhias aéreas (viagem)
  "7011": "outros",      // Hotéis e hospedagem (viagem)
  "4112": "outros",      // Trens / passeios turísticos

  // Saúde
  "5912": "saude", // Farmácias e drogarias
  "8011": "saude", // Médicos
  "8021": "saude", // Dentistas
  "8031": "saude", // Osteopatas
  "8041": "saude", // Quiropraxistas
  "8042": "saude", // Oftalmologistas / óticas
  "8049": "saude", // Podólogos e afins
  "8050": "saude", // Casas de repouso
  "8062": "saude", // Hospitais
  "8071": "saude", // Laboratórios médicos e dentais
  "8099": "saude", // Serviços médicos diversos

  // Educação
  "5192": "educacao", // Livros e periódicos
  "5942": "educacao", // Livrarias
  "8211": "educacao", // Escolas
  "8220": "educacao", // Faculdades e universidades
  "8241": "educacao", // Cursos por correspondência / EAD
  "8244": "educacao", // Escolas de negócios / secretariado
  "8249": "educacao", // Escolas técnicas e profissionalizantes
  "8299": "educacao", // Serviços educacionais diversos

  // Lazer & assinaturas
  "4899": "lazer", // TV por assinatura e streaming
  "5735": "lazer", // Música e mídia digital
  "5815": "lazer", // Assinaturas de streaming (alternativo)
  "5817": "lazer", // Jogos digitais
  "7829": "lazer", // Produção e distribuição de filmes
  "7832": "lazer", // Cinemas
  "7841": "lazer", // Locadoras de vídeo
  "7911": "lazer", // Casas de dança e estúdios
  "7922": "lazer", // Shows e teatros
  "7929": "lazer", // Bandas e orquestras
  "7932": "lazer", // Boliches
  "7941": "lazer", // Clubes esportivos e ingressos
  "7991": "lazer", // Atrações turísticas
  "7996": "lazer", // Parques de diversão
  "7997": "lazer", // Clubes de lazer e country clubs
  "7999": "lazer", // Serviços de recreação diversos

  // Compras
  "5300": "compras", // Clubes de compras / atacado
  "5310": "compras", // Lojas de departamento
  "5311": "compras", // Lojas de departamento
  "5399": "compras", // Variedades / bazar
  "5611": "compras", // Vestuário masculino
  "5621": "compras", // Vestuário feminino
  "5631": "compras", // Acessórios femininos
  "5641": "compras", // Roupas infantis
  "5651": "compras", // Vestuário em geral
  "5655": "compras", // Artigos esportivos
  "5661": "compras", // Calçados
  "5691": "compras", // Vestuário diverso
  "5712": "compras", // Móveis
  "5722": "compras", // Eletrodomésticos
  "5732": "compras", // Eletrônicos
  "5733": "compras", // Instrumentos musicais
  "5941": "compras", // Artigos esportivos (lojas)
  "5945": "compras", // Brinquedos e jogos
  "5977": "compras", // Cosméticos
  "5999": "compras", // Varejo diverso / e-commerce genérico

  // Outros (seguros, cuidados pessoais, serviços domésticos, tarifas, pets, viagens)
  "6300": "outros", // Seguros
  "6381": "outros", // Prêmios de seguro
  "742":  "outros", // Serviços veterinários
  "780":  "outros", // Paisagismo e jardinagem
  "7210": "outros", // Lavanderias
  "7211": "outros", // Lavanderias industriais
  "7230": "outros", // Salões de beleza e barbearias
  "7298": "outros", // Spas e institutos de beleza
  "7349": "outros", // Limpeza e serviços domésticos
  "7392": "outros", // Serviços de consultoria
  "7399": "outros", // Serviços diversos
  "5995": "outros", // Pet shops
  "5992": "outros", // Floriculturas
  "6011": "outros", // Saque em caixa eletrônico
  "6012": "outros"  // Serviços financeiros diversos
};

FA.MCC_LABELS = {
  "5411": "Supermercados e mercearias",
  "5462": "Padarias e confeitarias",
  "5812": "Restaurantes e lanchonetes",
  "5813": "Bares e casas noturnas",
  "4121": "Táxi e transporte por app",
  "5541": "Postos de combustível",
  "7523": "Estacionamentos e garagens",
  "5912": "Farmácias e drogarias",
  "8062": "Hospitais",
  "5942": "Livrarias",
  "8220": "Faculdades e universidades",
  "4899": "TV por assinatura e streaming",
  "5735": "Música e mídia digital",
  "7832": "Cinemas",
  "5655": "Artigos esportivos",
  "5722": "Eletrodomésticos",
  "5999": "Varejo diverso",
  "6300": "Seguros",
  "7230": "Salões de beleza",
  "5995": "Pet shops",
  "6011": "Saque em caixa eletrônico"
};
