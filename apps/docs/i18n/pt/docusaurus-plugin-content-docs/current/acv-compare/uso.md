---
sidebar_label: 'Utilização'
sidebar_position: 3
---

# Utilização

Este serviço recebe os resultados de ACV calculados pelo **LCA Bridge** sempre que ambos estão a ser executados em simultâneo. Se for a primeira vez que um utilizador realiza um cálculo de ACV, será enviado um email com a sua palavra-passe de acesso.

A interface está disponível em espanhol, inglês e português. Pode mudar o idioma a partir do seletor na barra de navegação, e a escolha é mantida entre sessões.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Email de boas-vindas ao LCA Compare" width="600"/>
</p>

## Visualizar Resultados de ACV de uma Parcela

Para visualizar as parcelas do seu utilizador, com sessão iniciada selecione a imagem de perfil e *As minhas parcelas*.

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="As minhas parcelas" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="Vista das minhas parcelas" width="600"/>
</p>

A partir da lista de parcelas, pode aceder ao detalhe de cada uma, onde são apresentados o identificador SIGPAC, a referência cadastral, um mapa com o polígono da parcela e as culturas associadas ordenadas por campanha. As parcelas marcadas por um administrador como **parcelas de referência** são identificadas com o distintivo «Referência» junto ao nome. Se não foi possível determinar a localização da parcela ao ingeri-la, é apresentado «Localização não disponível» em vez do mapa; essas parcelas não aparecem nos filtros por localização geográfica do comparador.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Exemplo de parcela" width="600"/>
</p>

Ao selecionar uma cultura, são apresentados os resultados de ACV discriminados por categoria de impacto: fertilizantes, maneio da cultura, pesticidas, sistema de rega e impacto total. A partir desta vista também pode usar **Adicionar à comparação** para abrir o comparador com essa parcela pré-carregada como conjunto de Referência ou Alvo.

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
- Parcelas (as suas próprias parcelas; requer sessão iniciada)
- Localização (ponto selecionado num mapa e raio em metros; inclui todas as campanhas das parcelas dentro do raio)
- Tipo de cultura
- Ano de campanha (início ou fim; a partir de 2020)
- **Apenas parcelas de referência**: limita o conjunto às parcelas marcadas como referência

Este filtro pode ser aplicado a qualquer um dos dois conjuntos e combina-se com os restantes filtros. Uma **parcela de referência** é uma parcela que um administrador marcou como dado validado; não deve ser confundida com o **conjunto de Referência**, que é o conjunto obrigatório da comparação.

O conjunto de **Referência** é obrigatório. Se apenas for especificada a referência, serão apresentados os valores médios de impacto do conjunto. Se também for especificado um conjunto **Alvo**, será calculada para cada categoria a diferença percentual do alvo em relação à referência.

Os valores são por kg de produto. O valor de cada conjunto é a **média simples** das suas campanhas: cada campanha conta o mesmo, sem ponderar por produção nem área. Cada categoria é calculada só com as campanhas que a incluem, pelo que uma categoria ausente numa campanha não conta como 0.

A **Referência** atua sempre como linha de base e o **Alvo** é o conjunto que se avalia em relação a ela:

```
Diferença (%) = (alvo − referência) / |referência| × 100
```

- Um valor **positivo** (a vermelho) indica que o alvo tem **mais** impacto do que a referência. Por exemplo, +20 % significa que o impacto do alvo supera em 20 % o da referência.
- Um valor **negativo** (a verde) indica que o alvo tem **menos** impacto do que a referência.
- É apresentado **n/a** quando o valor de referência é 0 ou a categoria não tem dados no alvo.

<p align="center">
    <img src="/img/acv-compare/ejemplo_comparativa_acv.png" alt="Exemplo de comparação de ACV" width="800"/>
</p>

### Exportar Resultados

Tanto no detalhe de um resultado de ACV como no comparador, pode exportar os dados em formato **JSON** ou **CSV** através dos botões de exportação:

- **JSON**: preserva a estrutura completa da resposta, incluindo metadados e discriminação por categorias.
- **CSV**: gera um ficheiro de valores separados por ponto e vírgula (`;`) com a discriminação por categoria de impacto, pronto para abrir em folhas de cálculo.

No comparador, as opções disponíveis são:

- **Exportar comparação**: exporta os resultados de ambos os conjuntos com os metadados dos filtros aplicados.
- **Exportar referência**: exporta apenas os valores do conjunto de referência.
- **Exportar alvo**: exporta apenas os valores do conjunto alvo.

### Gerar Relatório

Também pode gerar um relatório detalhado da comparação em **PDF** clicando em **Gerar relatório**. O relatório contém um resumo da comparação gerado por IA, recomendações para o conjunto alvo, os três impactos com maior diferença e a discriminação completa da comparação por categorias. O relatório é gerado no idioma ativo da interface.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Botão para gerar relatório de ACV" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="Exemplo de relatório de comparação de ACV" width="400"/>
</p>

## Administração

Se o utilizador que inicia sessão tiver o papel de administrador, será redirecionado automaticamente para o painel de administração. O menu lateral agrupa as secções em **Dados** (utilizadores, parcelas e culturas) e **Catálogos** (métodos de impacto, países, províncias e localidades), com o número de registos de cada uma. Em cada secção é possível pesquisar, paginar, criar, editar e eliminar registos. Os registos relacionados (proprietário, localidade, parcela...) são apresentados pelo nome, escolhem-se com uma caixa de pesquisa e, ao clicar neles, abrem a sua secção filtrada por esse registo. A secção e os filtros ficam guardados no endereço da página, pelo que podem ser recarregados ou partilhados.

A gestão de parcelas permite marcar ou desmarcar uma parcela como **parcela de referência** e atribuir a localidade às parcelas que não a têm: o painel indica quantas existem e permite filtrá-las com **Só sem localidade**. Uma parcela sem localidade não aparece nos filtros por país, província ou localidade do comparador.

Ao eliminar:

- uma parcela, são eliminadas também as suas culturas e os seus resultados de impacto;
- uma cultura, é eliminado também o seu resultado de impacto;
- um utilizador com parcelas, um país com províncias, uma província com localidades, uma localidade com parcelas ou um método de impacto com resultados, o painel impede-o e explica o motivo.

Um administrador não pode eliminar a sua própria conta nem retirar a si próprio o papel de administrador.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Painel de administração" width="600"/>
</p>

## Estatísticas Globais

A rota **Estatísticas** apresenta uma visão agregada dos resultados registados no LCA Compare. Permite filtrar por ano, categoria de impacto, tipo de cultura e província, e visualiza:

- KPIs globais: número de parcelas, culturas e superfície total, impacto médio por categoria e variação interanual de cada categoria. A variação interanual compara só as parcelas com resultado no ano escolhido e no anterior (pelo menos 3), para que as entradas e saídas de explorações não a afetem.
- A toxicidade humana é apresentada em duas categorias, cancerígena e não cancerígena, como no EF 3.1.
- A dotação de água (m³/ha) e a produtividade da água (kg/m³) são calculadas só com culturas de regadio (consumo de água superior a 0); o rendimento (kg/ha) inclui todas.
- Ranking de províncias e localidades. Ao clicar numa entrada, abre-se o comparador com essa província ou localidade pré-carregada como conjunto de Referência. O ranking de localidades inclui uma caixa de pesquisa que mostra a posição da localidade no ranking.
- Evolução temporal dos impactos, com um gráfico de tendência (sparkline) por categoria.
- Perfil de impacto: gráfico de radar que permite comparar duas províncias ou duas localidades.
- Mapa de calor por província e categoria; ao clicar no nome de uma categoria, o mapa é reordenado pelos seus valores.
- Distribuição de culturas e relação entre produção e impacto.
