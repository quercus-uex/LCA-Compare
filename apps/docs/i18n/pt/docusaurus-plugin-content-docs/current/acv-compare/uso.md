---
sidebar_label: 'Utilização'
sidebar_position: 3
---

# Utilização

O LCA Compare recebe os resultados de ACV calculados pelo **LCA Bridge**. Quando chega o primeiro cálculo de um utilizador, é criada a sua conta e, se o envio de email estiver configurado, o utilizador recebe um email com a sua palavra-passe de acesso. Não existe registo público: as restantes contas são criadas por um administrador.

O email (em espanhol) é este:

```text
Asunto: Alta en LCA Compare

Has sido dado de alta en LCA Compare. Tu contraseña es <contraseña>.
```

A interface está disponível em espanhol, inglês e português. Pode mudar o idioma a partir do seletor na barra de navegação, e a escolha é mantida entre sessões.

## Visualizar Resultados de ACV de uma Parcela

Para visualizar as parcelas do seu utilizador, com sessão iniciada selecione *As minhas parcelas* na barra de navegação (em ecrãs estreitos, dentro do menu ☰).

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="As minhas parcelas" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="Vista das minhas parcelas" width="600"/>
</p>

A lista mostra cada parcela com a sua localidade, a cultura atual, a área e o número de campanhas. Pode pesquisar por nome, identificador (SIGPAC, referência cadastral ou ID predial) ou localidade, filtrar por cultura atual, por localidade ou só as parcelas de referência, e ordenar por nome, última campanha ou área. As parcelas podem ser vistas como cartões, como tabela ou sobre um mapa, onde cada uma é colorida segundo a sua cultura atual. A pesquisa, os filtros e a vista ficam guardados no endereço da página, pelo que se mantêm ao voltar do detalhe de uma parcela.

Ao abrir uma parcela é apresentado um mapa com o seu polígono (com camada de ruas ou de satélite), a sua localidade, os seus identificadores, os dados da cultura atual e o histórico de todas as campanhas. Se a parcela tiver mais de uma campanha, um gráfico mostra a evolução da produção, do rendimento, do consumo de água ou do impacto total de qualquer categoria EF 3.1. **Comparar esta parcela** abre o comparador com a parcela pré-carregada como conjunto objetivo ou de referência. As parcelas marcadas por um administrador como **parcelas de referência** são identificadas com o distintivo «Referência» junto ao nome. Se não foi possível determinar a localização da parcela ao ingeri-la, é apresentado «Localização não disponível» em vez do mapa; essas parcelas não aparecem na vista de mapa da lista nem nos filtros por localização geográfica do comparador.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Exemplo de parcela" width="600"/>
</p>

Ao clicar em **Ver impactos** na cultura atual ou em qualquer campanha do histórico, são apresentados os resultados de ACV dessa campanha: o impacto total de cada categoria e uma barra com a sua repartição entre fertilizantes, maneio da cultura, pesticidas e sistema de rega. Em ecrãs largos a tabela mostra também o valor de cada etapa; o detalhe completo está sempre incluído na exportação. A partir desta vista também pode exportar o resultado em JSON ou CSV e usar **Comparar esta parcela**.

<p align="center">
    <img src="/img/acv-compare/acv_parcela.png" alt="ACV de uma parcela" width="600"/>
</p>

## Comparador de ACV

O comparador abre-se a partir de **Comparador** na barra de navegação.

<p align="center">
    <img src="/img/acv-compare/boton_comparador.png" alt="Botão Comparador na barra de navegação" width="600"/>
</p>

Compara dois conjuntos de culturas, cada um definido por estes filtros:

- País
- Província
- Localidade
- Parcelas (as suas próprias parcelas; requer sessão iniciada)
- Localização (ponto selecionado num mapa e raio em metros; inclui todas as campanhas das parcelas dentro do raio)
- Tipo de cultura
- Ano de campanha (início ou fim; a partir de 2020)
- **Apenas parcelas de referência**: limita o conjunto às parcelas marcadas como referência
- **Organização**: limita o conjunto às campanhas que os membros da sua organização lhe consentiram (só aparece se administrar alguma; ver [Organizações](#organizações))

O filtro de parcelas de referência pode ser aplicado a qualquer um dos dois conjuntos e combina-se com os restantes filtros. Uma **parcela de referência** é uma parcela que um administrador marcou como dado validado; não deve ser confundida com o **conjunto de Referência**, que é o conjunto obrigatório da comparação.

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

Tanto no detalhe de um resultado de ACV como no comparador, pode exportar os dados em formato **JSON** ou **CSV** a partir do menu **Exportar**:

- **JSON**: preserva a estrutura completa da resposta, incluindo metadados e discriminação por categorias.
- **CSV**: gera um ficheiro de valores separados por ponto e vírgula (`;`) com a discriminação por categoria de impacto, pronto para abrir em folhas de cálculo.

No comparador, o menu oferece três conjuntos de dados, cada um em JSON ou CSV:

- **Exportar comparação**: exporta os resultados de ambos os conjuntos com os metadados dos filtros aplicados.
- **Exportar referência**: exporta apenas os valores do conjunto de referência.
- **Exportar alvo**: exporta apenas os valores do conjunto alvo.

### Gerar Relatório

**Gerar relatório** cria um relatório da comparação em **PDF**. Contém um resumo da comparação gerado por IA, recomendações para o conjunto alvo, os três impactos com maior diferença e a discriminação completa da comparação por categorias. O relatório é gerado no idioma ativo da interface.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Botão para gerar relatório de ACV" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="Exemplo de relatório de ACV em PDF" width="400"/>
</p>

## Administração

Se o utilizador que inicia sessão tiver o papel de administrador, será redirecionado automaticamente para o painel de administração. O menu lateral agrupa as secções em **Dados** (utilizadores, parcelas e culturas) e **Catálogos** (métodos de impacto, países, províncias e localidades), com o número de registos de cada uma. Em cada secção é possível pesquisar, paginar, criar, editar e eliminar registos. Os registos relacionados (proprietário, localidade, parcela...) são apresentados pelo nome, escolhem-se com uma caixa de pesquisa e, ao clicar neles, abrem a sua secção filtrada por esse registo. A secção e os filtros ficam guardados no endereço da página, pelo que podem ser recarregados ou partilhados.

A gestão de parcelas permite marcar ou desmarcar uma parcela como **parcela de referência** e atribuir a localidade às parcelas que não a têm: o painel indica quantas existem e permite filtrá-las com **Só sem localidade**. Uma parcela sem localidade não aparece nos filtros por país, província ou localidade do comparador.

Ao eliminar:

- uma parcela, são eliminadas também as suas culturas e os seus resultados de impacto;
- uma cultura, é eliminado também o seu resultado de impacto;
- um utilizador com parcelas, um país com províncias, uma província com localidades, uma localidade com parcelas ou um método de impacto com resultados, o painel impede-o e explica o motivo.

Um administrador não pode eliminar a sua própria conta nem retirar a si próprio o papel de administrador. Também não é possível eliminar um utilizador que administra organizações: antes tem de as transferir ou eliminar.

No grupo **Dados** estão também as **organizações**, que podem ser consultadas e eliminadas (são criadas e editadas a partir da aplicação), e os **consentimentos**, só de leitura, com a sua organização, utilizador, campanha e estado.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Painel de administração" width="600"/>
</p>

## Estatísticas Globais

A rota **Estatísticas** apresenta uma visão agregada dos resultados registados no LCA Compare. Permite filtrar por categoria de impacto, tipo de cultura e ano (e por organização, se administrar alguma), e visualiza:

- KPIs globais: número de parcelas, culturas e superfície total, impacto médio por categoria e variação interanual de cada categoria. A variação interanual compara só as parcelas com resultado no ano escolhido e no anterior (pelo menos 3), para que as entradas e saídas de explorações não a afetem.
- Ranking de províncias e localidades. Ao clicar numa entrada, abre-se o comparador com essa província ou localidade pré-carregada como conjunto de Referência. O ranking de localidades pode ser limitado a uma província e inclui uma caixa de pesquisa que mostra a posição de cada localidade.
- Evolução temporal dos impactos, com um gráfico de tendência (sparkline) por categoria.
- Perfil de impacto: gráfico de radar que permite comparar duas províncias ou duas localidades.
- Mapa de calor por província e categoria; ao clicar no nome de uma categoria, o mapa é reordenado pelos seus valores.
- Distribuição de culturas e relação entre produção e impacto.

A toxicidade humana é apresentada em duas categorias, cancerígena e não cancerígena, como no EF 3.1. A dotação de água (m³/ha) e a produtividade da água (kg/m³) são calculadas só com culturas de regadio (consumo de água superior a 0); o rendimento (kg/ha) inclui todas.

## Organizações

Uma organização permite analisar em conjunto as campanhas de vários utilizadores. Qualquer utilizador com sessão iniciada pode criar organizações a partir de **Organizações** na barra de navegação, e quem a cria é o seu único administrador.

O administrador pede acesso a outros utilizadores no separador **Pedir acesso** do painel da organização, indicando o email de um utilizador já registado e as campanhas (anos, de 2020 até ao seguinte ao atual) a que quer aceder. O consentimento é dado por utilizador e por campanha.

O utilizador recebe o pedido nas notificações da barra de navegação (ícone de sino) e, se o envio de email estiver configurado, também por email. A partir daí aceita ou rejeita cada campanha, ou todas de uma vez. **Uma campanha aceite só pode ser revogada pelo administrador da organização**: o utilizador não a pode retirar nem sair da organização. Se rejeitar uma campanha, o administrador pode voltar a pedi-la.

Com uma campanha aceite, o administrador pode:

- Consultar as parcelas do membro (**Ver parcelas** no separador **Membros**), com o seu mapa, culturas e resultados de ACV, mas só das campanhas aceites.
- Usar a organização como filtro no [comparador](#comparador-de-acv) e nas [estatísticas](#estatísticas-globais). O filtro inclui apenas as culturas das campanhas aceites pelos membros e daquelas com que o próprio administrador contribui.

O administrador também pode contribuir com as suas próprias parcelas: em **As minhas campanhas**, no separador **Membros**, marca as campanhas que quer incluir e desmarca-as para as retirar. Não é necessário pedido nem aceitação, e essas campanhas contam como as de qualquer membro. Se transferir a administração, fica como membro com as campanhas com que contribuía.

No separador **Membros** o administrador vê o estado de cada campanha (pendente, aceite, rejeitada ou revogada) e pode cancelar um pedido pendente, revogar uma campanha aceite ou remover um membro, o que revoga todas as suas campanhas. Em **Definições** pode alterar o nome e a descrição, transferir a administração para um membro com alguma campanha aceite ou eliminar a organização. O utilizador afetado é avisado de cada revogação, remoção, transferência ou eliminação.

Em **Organizações**, cada utilizador vê também as organizações de que é membro, quem as administra e que campanhas concedeu, com o seu estado.
