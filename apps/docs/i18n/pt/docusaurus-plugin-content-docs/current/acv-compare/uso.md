---
sidebar_label: 'Utilização'
sidebar_position: 3
---

# Utilização

Este serviço recebe os resultados de ACV calculados pelo **Capture ACV** sempre que ambos estão a ser executados em simultâneo. Se for a primeira vez que um utilizador realiza um cálculo de ACV, será enviado um email com a sua palavra-passe de acesso.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Email de boas-vindas ao ACV Compare" width="600"/>
</p>

## Visualizar Resultados de ACV de uma Parcela

Para visualizar as parcelas do seu utilizador, com sessão iniciada selecione a imagem de perfil e *As minhas parcelas*.

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="As minhas parcelas" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="Vista das minhas parcelas" width="600"/>
</p>

A partir da lista de parcelas, pode aceder ao detalhe de cada uma, onde são apresentados o identificador SIGPAC, a referência cadastral, um mapa com o polígono da parcela e as culturas associadas ordenadas por campanha.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Exemplo de parcela" width="600"/>
</p>

Ao selecionar uma cultura, são apresentados os resultados de ACV discriminados por categoria de impacto: fertilizantes, maneio da cultura, pesticidas, sistema de rega e impacto total.

<p align="center">
    <img src="/img/acv-compare/acv_parcela.png" alt="ACV de uma parcela" width="600"/>
</p>

## Comparador de ACV

O comparador de ACV é acedido a partir do botão disponível na barra de navegação.

<p align="center">
    <img src="/img/acv-compare/boton_comparador.png" alt="Botão do comparador de ACV" width="600"/>
</p>

Nele, pode comparar dois conjuntos de culturas, filtrando por:

- País
- Província
- Localidade
- Localização (coordenadas e raio em quilómetros)
- Tipo de cultura
- Ano de campanha (início ou fim)

O conjunto de **Referência** é obrigatório. Se apenas for especificada a referência, serão apresentados os valores médios de impacto do conjunto. Se também for especificado um conjunto **Objetivo**, será calculada a diferença percentual entre ambos para cada categoria.

<p align="center">
    <img src="/img/acv-compare/ejemplo_comparativa_acv.png" alt="Exemplo de comparação de ACV" width="800"/>
</p>

### Exportar Resultados

Depois de realizada a comparação, pode exportar os resultados em formato **JSON** através dos botões de exportação:

- **Exportar comparação**: exporta os resultados de ambos os conjuntos com os metadados dos filtros aplicados.
- **Exportar referência**: exporta apenas os valores do conjunto de referência.
- **Exportar objetivo**: exporta apenas os valores do conjunto objetivo.

### Gerar Relatório

Também pode gerar um relatório detalhado da comparação em **PDF** clicando em **Gerar relatório**. O relatório contém um resumo da comparação gerado por IA, recomendações para o conjunto objetivo, os três impactos com maior diferença e a discriminação completa da comparação por categorias.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Botão para gerar relatório de ACV" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="Exemplo de relatório de comparação de ACV" width="400"/>
</p>

## Administração

Se o utilizador que inicia sessão tiver o papel de administrador, será redirecionado automaticamente para o painel de administração. A partir daí poderá gerir utilizadores, parcelas, culturas, métodos de impacto, países, províncias e localidades. O painel inclui pesquisa, paginação, criação, edição, eliminação e ajudas para selecionar identificadores de entidades relacionadas.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Painel de administração" width="600"/>
</p>

## Estatísticas Globais

A rota **Estatísticas** apresenta uma visão agregada dos resultados registados no ACV Compare. Permite filtrar por ano, categoria de impacto, tipo de cultura e província, e visualiza:

- KPIs globais de culturas, parcelas, utilizadores, superfície, produção, água e impacto médio.
- Ranking de províncias e localidades.
- Evolução temporal dos impactos.
- Perfil de impacto, mapa de calor, distribuição de culturas e relação entre produção e impacto.
