# 🎮 MINIGAMES ARCADE

Sistema completo de jogos com autenticação, banco de dados e ranking.

## 📋 Conteúdo

- **app.py**: Backend Flask com API REST
- **templates/**: Páginas HTML (login, menu, games, ranking)
- **static/**: CSS e JavaScript para frontend
- **requirements.txt**: Dependências Python
- **minigames.db**: Banco de dados SQLite (criado automaticamente)

## 🚀 Como Executar

### Passo 1: Instalar Dependências

Abra PowerShell na pasta `Minigames_App` e execute:

```powershell
pip install -r requirements.txt
```

Se falhar, instale manualmente:
```powershell
pip install Flask==2.3.3 PyJWT==2.8.1 Werkzeug==2.3.7
```

### Passo 2: Executar o Servidor

```powershell
python app.py
```

Você verá:
```
============================================================
🎮 MINIGAMES ARCADE - Sistema de Jogos
============================================================
✓ Banco de dados criado/verificado
✓ Servidor em http://localhost:5000
✓ Pressione CTRL+C para parar
============================================================
```

### Passo 3: Acessar a Aplicação

Abra seu navegador e acesse: **http://localhost:5000**

## 🎮 Os 3 Jogos

### 🐍 Snake
- Coma a comida vermelha sem bater nas paredes
- Sua cobra cresce a cada comida
- Controle: Setas ou WASD
- Pontos: +10 por comida

### 🏓 Pong
- Rebata a bola contra a IA
- Movimento: Setas or Mouse
- Pontos: +50 por vitória na batida, risco de vida
- 3 vidas disponíveis

### 🚀 Space Shooter
- Destrua os inimigos que descem
- Controle: Setas esquerda/direita, SPACE para atirar
- Pontos: +100 por inimigo destruído
- 3 vidas disponíveis

## 🎲 Dificuldade

Antes de cada jogo, escolha:
- **1️⃣ Fácil**: Progressão lenta
- **2️⃣ Normal**: Progressão moderada
- **3️⃣ Difícil**: Progressão rápida
- **4️⃣ Insano**: Progressão muito rápida

Quanto mais difícil, mais rápido a dificuldade aumenta conforme você marca pontos!

## 👤 Autenticação

### Opções:
1. **Registrar**: Criar nova conta (username + senha criptografada)
2. **Login**: Entrar com conta existente
3. **Guest**: Jogar sem salvar (não aparece no ranking)

### Segurança:
- Senhas são criptografadas com bcrypt
- Token JWT com expiração de 30 dias
- Dados persistem no banco SQLite

## 🏆 Ranking

### Ranking Global
- Mostra os melhores jogadores de cada jogo
- Ordenado por maior pontuação

### Estatísticas Pessoais (apenas para usuários autenticados)
- Melhor score em cada jogo
- Total de partidas jogadas
- Score médio
- Histórico das últimas 10 partidas

## 💾 Banco de Dados

O arquivo `minigames.db` (SQLite) é criado automaticamente com:

**Tabela: usuarios**
- id (autoincrement)
- username (único)
- senha (criptografada)
- data_criacao

**Tabela: scores**
- id (autoincrement)
- usuario_id (FK para usuarios)
- jogo (snake, pong, space-shooter)
- pontuacao
- dificuldade_inicial
- dificuldade_final
- data_jogo

## 📊 Visualizar Dados do Banco

### Opção 1: SQLite CLI
```powershell
sqlite3 minigames.db
SELECT * FROM usuarios;
SELECT * FROM scores;
.quit
```

### Opção 2: DB Browser
Baixe em: https://sqlitebrowser.org/

## 🛑 Parar o Servidor

No PowerShell: **CTRL + C**

---

## 📦 Compilar para Executável (.exe)

Após testar, você pode gerar um `.exe` independente:

### Passo 1: Instalar PyInstaller

```powershell
pip install pyinstaller
```

### Passo 2: Gerar Executável

Na pasta `Minigames_App`:

```powershell
pyinstaller --onefile --windowed --name "MinigamesArcade" app.py
```

### Passo 3: Copiar Arquivos

A pasta `dist/` terá o executável. Copie:
- `dist/MinigamesArcade.exe`
- Pasta `templates/` inteira
- Pasta `static/` inteira

Coloque tudo no mesmo diretório.

### Passo 4: Executar

Duplo clique em `MinigamesArcade.exe` e acesse **http://localhost:5000** no navegador.

---

## ⚠️ Possíveis Problemas

**"Não consigo acessar http://localhost:5000"**
- Verifique se o servidor está rodando
- Tente `http://127.0.0.1:5000`
- Feche outros programas na porta 5000

**"Module not found"**
- Instale novamente as dependências: `pip install -r requirements.txt`

**"Banco de dados vazio"**
- O banco é criado automaticamente na primeira execução
- Aguarde um jogo ser registrado para aparecer no ranking

**"Reset de dados"**
- Delete `minigames.db` para limpar completamente
- Um novo será criado automaticamente

---

## 🎯 Controles

### Snake
- **Setas ↑↓←→ ou WASD**: Mover

### Pong
- **Setas ↑↓**: Mover paddle (ou Mouse)

### Space Shooter
- **Setas ←→**: Mover nave
- **SPACE**: Atirar

---

## 📝 Notas

- Dados persistem entre sessões (banco SQLite)
- Guests não têm dados salvos
- Dificuldade afeta velocidade dos inimigos e progressão
- Respeitive os limites de bateria do seu PC! 🔋

---

**Divirta-se! 🎮✨**
