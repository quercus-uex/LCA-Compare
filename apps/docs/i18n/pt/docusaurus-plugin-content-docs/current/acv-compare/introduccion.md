---
sidebar_label: 'Introdução'
sidebar_position: 1
---

# Introdução

**LCA Compare** é uma aplicação web que permite a visualização, comparação e geração de relatórios da Avaliação do Ciclo de Vida (ACV) de culturas agrícolas. Os resultados de ACV são calculados por [LCA Bridge](https://github.com/quercus-uex/LCA-Bridge), um serviço ponte entre a plataforma LCA Capture e o motor de cálculo openLCA com base de dados em formato .zolca. Ambos os serviços comunicam através de uma rede Docker partilhada.

## Funcionalidades

- **Gestão de parcelas** com integração de SIGPAC, Catastro e identificador predial português para localização e representação geoespacial de polígonos.
- **Visualização de resultados de ACV** por parcela e campanha, discriminados em categorias de impacto (fertilizantes, maneio da cultura, pesticidas, sistema de rega e impacto total).
- **Comparador de ACV** entre dois conjuntos de culturas filtrando por país, província, localidade, localização geográfica (raio em km), tipo de cultura e ano de campanha.
- **Geração de relatórios em PDF** com resumo e recomendações geradas por IA através do OpenRouter.
- **Exportação de resultados para JSON** tanto do conjunto de referência como do objetivo.
- **Dashboard de estatísticas** com KPIs globais, evolução temporal, rankings por província e localidade, mapas de calor, perfis de impacto e distribuição de culturas.
- **Painel de administração** para gestão de utilizadores, parcelas, culturas, métodos de impacto, países, províncias e localidades.
- **Autenticação JWT** com envio automático de credenciais por correio eletrónico no primeiro cálculo de ACV.

## Arquitetura

A aplicação segue uma arquitetura cliente-servidor com dois componentes diferenciados:

| Componente | Tecnologia | Porta |
|---|---|---|
| **Backend (API REST)** | NestJS 11 + Prisma ORM 7 | 3000 (interno) / 8080 (exposto) |
| **Frontend (SPA)** | React 19 + Vite 7 + TailwindCSS 4 + DaisyUI 5 | 80 |
| **Base de dados** | PostgreSQL 17 + PostGIS | 5432 |

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
- **Sonner** para notificações toast
