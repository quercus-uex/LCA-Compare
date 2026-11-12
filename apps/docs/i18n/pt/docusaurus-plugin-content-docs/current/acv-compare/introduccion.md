---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

**LCA Compare** é uma aplicação web para visualizar, comparar e gerar relatórios da Avaliação do Ciclo de Vida (ACV) de culturas agrícolas. Os resultados são calculados pelo [LCA Bridge](../openlca-bridge/introduccion.md) com o openLCA; ambos os serviços são implantados com o mesmo Docker Compose e comunicam através da sua rede interna.

## Funcionalidades

- **Gestão de parcelas** com integração de SIGPAC, Catastro e identificador predial português para localização e representação geoespacial de polígonos.
- **Resultados de ACV** por parcela e campanha: impacto de cada categoria EF 3.1 e a sua repartição entre fertilizantes, maneio da cultura, pesticidas e sistema de rega.
- **Comparador de ACV** entre um conjunto de referência e outro alvo, filtrando por localização administrativa ou geográfica, parcelas próprias, tipo de cultura, ano de campanha, parcelas de referência ou organização.
- **Exportação para JSON e CSV** dos resultados e das comparações.
- **Relatórios em PDF** com resumo e recomendações geradas por IA através do OpenRouter.
- **Organizações** para analisar em conjunto as campanhas que outros utilizadores consentem partilhar.
- **Dashboard de estatísticas** com KPIs globais, evolução temporal, rankings por província e localidade, mapas de calor, perfis de impacto e distribuição de culturas.
- **Painel de administração** para utilizadores, parcelas, culturas, métodos de impacto e dados territoriais, e consulta de organizações e consentimentos.
- **Criação automática de utilizadores**: ao receber o primeiro cálculo de ACV de um utilizador é criada a sua conta e, se o email estiver configurado, é-lhe enviada a sua palavra-passe.

## Arquitetura

| Componente | Tecnologia | Porta |
|---|---|---|
| **Backend (API REST)** | NestJS 11 + Prisma ORM 7 | 3000 (interno) |
| **Frontend (SPA)** | React 19 + Vite 7 + TailwindCSS 4 + DaisyUI 5 | 80 (única porta publicada) |
| **Base de dados** | PostgreSQL 17 + PostGIS | 5432 (interno) |

O backend expõe uma API REST documentada com Swagger/OpenAPI na rota `/docs`. O frontend é servido através de Nginx, que atua como proxy inverso encaminhando os pedidos `/api` para o backend e servindo a SPA para as restantes rotas.

## Stack Tecnológico

### Backend

- **Node.js 22** com **NestJS 11**
- **Prisma ORM 7** sobre PostgreSQL com extensão **PostGIS** para dados geoespaciais
- **JWT** para autenticação
- **Swagger/OpenAPI** para documentação da API
- **Playwright** para geração de PDFs
- **Handlebars** para modelos de relatórios
- **Nodemailer** para envio de emails
- **OpenRouter SDK** para integração com IA
- **proj4** para transformações de coordenadas
- **argon2** para hash de palavras-passe

### Frontend

- **React 19** com **TypeScript**
- **Vite 7** como bundler
- **TailwindCSS 4** + **DaisyUI 5** para estilos
- **Leaflet / React-Leaflet** para mapas interativos
- **React Router 7** para encaminhamento
- **React Hook Form** para formulários
- **i18next / react-i18next** para internacionalização da interface
- **Recharts** para gráficos do dashboard de estatísticas
- **Luxon** para datas
- **Sonner** para notificações toast
