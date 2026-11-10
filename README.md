<div align="center">
  
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

# ControlFinance v2.0.0

**ControlFinance** é uma aplicação web (SPA) moderna de controle financeiro pessoal, desenvolvida inteiramente com o apoio de Inteligência Artificial. 

Este projeto nasceu como um laboratório de estudos focado em explorar as capacidades das IAs generativas na arquitetura e escrita de software, aplicando na prática o emergente conceito de *"vibe coding"*. Todo o código-fonte — englobando a interface com Tailwind CSS, a integração de banco de dados e autenticação via Supabase, a lógica matemática para cálculos e acompanhamento de metas de investimentos, além das visualizações em Chart.js — foi arquitetado e gerado através de iterações em linguagem natural.

---

## 🚀 O que há de novo na Versão 2.0.0
- **Acompanhamento Dinâmico de Metas de Investimento:** Módulo inteligente que compara visualmente a sua projeção planejada (baseada em prazo, aporte mensal e rentabilidade esperada) versus a evolução real dos seus aportes.
- **Histórico de Metas Concluídas:** Sistema de gamificação financeira que registra suas vitórias e metas batidas, com opção de gerenciamento e exclusão de registros.
- **Backup e Restauração Completa (.JSON):** Ferramenta integrada de backup para exportar e restaurar todos os dados do usuário (tags, transações e ativos) de forma segura com mesclagem inteligente (*upsert*).
- **Reorganização de Layout:** Destaque para a Carteira de Ativos e otimização da experiência do usuário nas abas de investimentos e relatórios.

---

## 📊 Principais Funcionalidades
- **Autenticação Segura:** Login, cadastro e isolamento total de dados por usuário utilizando Supabase Auth e Row Level Security (RLS).
- **Dashboard e Transações:** Gestão completa de entradas, saídas, saldos mensais e KPIs dinâmicos.
- **Tags e Metas (Budgets):** Organização por categorias personalizadas com acompanhamento visual de limites de gastos mensais.
- **Carteira de Investimentos:** Cadastro de ativos com suporte a diferentes tipos (CDB, Ações, FIIs, Tesouro Direto, etc.) e taxas de rendimento.
- **Relatórios Avançados:** Filtros customizados por data, tipo e tags, com suporte a visualização gráfica (barra/pizza), exportação de planilhas CSV e impressão otimizada em PDF.
- **UI/UX Moderna:** Interface responsiva construída com Tailwind CSS e suporte nativo ao *Dark Mode*.

---

## 🛠 Tecnologias e Arquitetura
- **Front-end:** HTML5, CSS3 e JavaScript (Vanilla SPA).
- **Estilização:** Tailwind CSS (via CDN) para design responsivo, utilitário e suporte ao modo escuro.
- **Visualização de Dados:** Chart.js para renderização fluida e interativa de gráficos.
- **Back-end & Banco de Dados:** Supabase (PostgreSQL / BaaS).
- **Segurança:** Supabase Auth e políticas de Row Level Security (RLS) aplicadas diretamente no banco de dados.

---

## ⚙️ Como Configurar o Supabase (Banco de Dados)

Para que o aplicativo salve seus dados em nuvem e permita o cadastro de contas, conecte o seu próprio projeto gratuito no Supabase seguindo os passos abaixo:

### 1. Criar o Projeto no Supabase
1. Acesse o site oficial do [Supabase](https://supabase.com/) e crie uma conta.
2. No painel, clique em **New Project**, defina um nome (ex: `ControlFinance`) e uma senha segura.

### 2. Copiar as Credenciais
1. No painel do seu projeto, vá em **Project Settings > API**.
2. Copie a **Project URL** e a chave **anon / public** (`API Key`).

### 3. Rodar o Script SQL (Tabelas e RLS)
No menu lateral esquerdo do Supabase, clique em **SQL Editor**, abra um *New Query*, cole o código abaixo e clique em **Run**:

```sql
-- 1. Tabela de Tags
CREATE TABLE IF NOT EXISTS public.tags (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    budget NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Privacidade Tags" ON public.tags FOR ALL USING (auth.uid() = user_id);

-- 2. Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    type TEXT CHECK (type IN ('INCOME', 'EXPENSE')) NOT NULL,
    tagId TEXT,
    status TEXT CHECK (status IN ('PAID', 'PENDING')) DEFAULT 'PAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Privacidade Transações" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- 3. Tabela de Investimentos
CREATE TABLE IF NOT EXISTS public.investments (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    rate NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Privacidade Investimentos" ON public.investments FOR ALL USING (auth.uid() = user_id);
