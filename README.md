<div align="center">
  
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

# ControlFinance

ControlFinance é uma aplicação web (SPA) de controle financeiro pessoal, desenvolvida inteiramente com o apoio de Inteligência Artificial.

Este projeto nasceu como um laboratório de estudos focado em explorar as capacidades das IAs generativas na arquitetura e escrita de software, aplicando na prática o emergente conceito de "vibe coding". Todo o código-fonte — englobando a interface com Tailwind CSS, a integração de banco de dados e autenticação via Supabase, a lógica matemática para cálculos de investimentos e as visualizações em Chart.js — foi arquitetado e gerado através de iterações em linguagem natural e engenharia de prompts.

Mais do que um gerenciador de despesas e investimentos, este repositório serve como um caso de estudo sobre como ferramentas de IA podem acelerar o desenvolvimento do zero à produção, transformando ideias abstratas em produtos funcionais.

## Principais Funcionalidades

- **Autenticação Segura (Supabase).**
- **Dashboard e Transações.**
- **Tags e Metas (Budgets).**
- **Carteira de Investimentos.**
- **Relatórios e Gráficos.**
- **Importação e Exportação (CSV/PDF).**
- **UI/UX e Configurações.**

## Tecnologias e Arquitetura

- **Front-end**: HTML5, CSS3 e JavaScript (Vanilla).
- **Estilização**: Tailwind CSS (via CDN) para design responsivo, utilitário e suporte nativo ao Dark Mode.
- **Visualização de Dados**: Chart.js para a renderização fluida e interativa de gráficos de barras, linhas e pizza.
- **Back-end & Database**: Supabase (PostgreSQL) atuando como Backend-as-a-Service (BaaS).
- **Autenticação & Segurança**: Supabase Auth com políticas de Row Level Security (RLS) diretamente no banco de dados, garantindo isolamento total dos dados por usuário.
- **Gestão de Estado**: Lógica de estado e manipulação do DOM gerenciados nativamente via JavaScript, combinando localStorage para retenção de configurações (como chaves de API).

## Como Executar o Projeto e Banco de Dados

Abra seu navegador e utilize o link:
- [ControlFinance](https://controlfinanceweb.netlify.app/)
- Crie sua conta em **Criar Nova Conta**, ou testar modo demonstrativo.

### Como Configurar o Supabase (Banco de Dados)

Para que o aplicativo salve seus dados em nuvem e permita o cadastro de contas, você precisa conectar o seu próprio banco de dados gratuito no Supabase. O processo leva menos de 5 minutos:

#### 1. Criar a Conta e o Projeto
1. Acesse o site oficial do [Supabase](https://supabase.com/) e clique em **"Start your project"**.
2. Faça login usando sua conta do GitHub ou e-mail.
3. No painel inicial, clique no botão verde **"New Project"**.
4. Selecione a organização, dê um nome ao projeto (ex: `ControlFinance`), crie uma senha forte para o banco de dados e clique em **"Create new project"**. Aguarde alguns minutos até que o banco seja provisionado.

#### 2. Pegar suas Credenciais (Chave e URL)
Com o projeto criado e com status "Healthy":
1. Na página inicial do seu projeto no Supabase, role a página até a seção **"Project API"** (ou "Connecting to your project").
2. Lá você encontrará a **`Project URL`** (um link que começa com `https://`). Copie este valor.
3. Logo abaixo, você encontrará a **`Project API keys`**. Copie a chave identificada como **`anon` / `public`** (é um texto bem longo que começa com `eyJ`).
   * *Atenção: Não copie a chave `service_role` (ela é secreta e tem permissões totais).*

#### 3. Conectar ao App ControlFinance
1. Abra o [ControlFinance](https://controlfinanceweb.netlify.app/) no seu navegador.
2. Na tela inicial ou na aba **"Configurações"**, procure pela seção de **"Conexão Supabase"**.
3. Cole a sua **URL** e a sua **Chave (`anon_key`)** nos campos indicados e clique em Salvar.
4. O aviso mudará para **"⚡ Supabase Conectado"** (verde).

#### 4. Rodar o Script de Segurança (SQL)
Para que as tabelas existam e o isolamento de dados funcione, aplique o código abaixo no seu Supabase:
1. No menu lateral esquerdo do Supabase, clique no ícone **SQL Editor** (`>_`).
2. Clique em **"New Query"**.
3. Copie o script SQL abaixo, cole no editor e aperte **Run**:

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