# 🎮 Minigames Arcade - Deploy Render.com

## Preparação Completa ✅

Todos os arquivos necessários foram criados:
- ✅ `render.yaml` - Configuração do Render
- ✅ `requirements.txt` - Dependências (com gunicorn)
- ✅ `.gitignore` - Arquivos a ignorar
- ✅ `app.py` - Modificado para produção

---

## INSTRUÇÕES MANUAIS - Siga Exatamente na Ordem

### PASSO 1: Criar Repositório GitHub
1. Acesse [github.com](https://github.com)
2. Login com sua conta (ou criar se não tiver)
3. Clique no ícone **+** no canto superior direito
4. Selecione **New repository**
5. Nome: `minigames-arcade`
6. Descrição: `🎮 Minigames Arcade - Sistema de Jogos Multiplayer`
7. Selecione **Public** (importante!)
8. **NÃO** inicialize com README
9. Clique **Create repository**

### PASSO 2: Git - Preparar e fazer Push

Abra o PowerShell/Terminal **na pasta Minigames_App**:

```powershell
# Entrar na pasta do projeto
cd "c:\Users\ricks\Documents\DEV\BACK-END\Python Codes\Minigames_App"

# Inicializar git
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "Initial commit - Minigames Arcade"

# Renomear branch para main
git branch -M main

# Adicionar repositório remoto (MUDE SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/minigames-arcade.git

# Fazer push
git push -u origin main
```

**Pronto!** Seu código agora está no GitHub.

### PASSO 3: Deploy no Render

1. Acesse [render.com](https://render.com)
2. Clique **Sign up** (ou faça login se já tiver)
   - Use sua conta GitHub para facilitar
3. Clique no botão **+ New** no painel superior
4. Selecione **Web Service**
5. Conecte seu repositório GitHub:
   - Clique **Connect account** ou **Connect a repository**
   - Autorize o Render a acessar seu GitHub
   - Selecione `minigames-arcade`
6. Configure o Web Service:
   - **Name:** `minigames-arcade`
   - **Runtime:** Python 3
   - **Region:** Escolha a mais próxima (ex: São Paulo se tiver)
   - **Build Command:** `pip install -r requirements.txt` (deve aparecer automaticamente)
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT app:app` (deve aparecer automaticamente)
7. Clique **Create Web Service**

**Aguarde 2-5 minutos** enquanto o Render faz o build e deploy.

Você verá a URL pública assim que ficar pronto! (algo como `https://minigames-arcade.onrender.com`)

---

## Como Atualizar o Código Online

Depois que estiver online, **toda vez que quiser fazer mudanças**:

### Opção A: Via Terminal (Recomendado)

```powershell
# Entrar na pasta do projeto
cd "c:\Users\ricks\Documents\DEV\BACK-END\Python Codes\Minigames_App"

# Ver mudanças feitas
git status

# Adicionar as mudanças
git add .

# Fazer commit com mensagem
git commit -m "Descrição da mudança - ex: Ajuste velocidade do snake"

# Fazer push para GitHub
git push
```

**Pronto!** O Render verá a atualização e fará o deploy automaticamente em ~1 minuto.

### Opção B: Via GitHub Web (Mais fácil para edições rápidas)

1. Vá ao seu repositório no GitHub
2. Clique no arquivo a editar
3. Clique no ícone de lápis (Edit)
4. Faça as mudanças
5. Clique "Commit changes" (no fim da página)
6. Render atualiza automaticamente

---

## Exemplo: Alterando a Velocidade do Snake

Se quiser mudar a velocidade do Snake online:

1. Abra `static/js/games.js` localmente
2. Encontre a linha com velocidade (busque por "cabeca" ou "Base..")
3. Modifique o valor
4. Salve o arquivo
5. Terminal:
   ```powershell
   cd "C:\Users\ricks\Documents\DEV\BACK-END\Python Codes\Minigames_App"
   git add static/js/games.js
   git commit -m "Ajuste velocidade do snake"
   git push
   ```
6. Espere ~1 minuto
7. Recarregue o site online - mudança refletida!

---

## Links Importantes

- **Site Online:** `https://minigames-arcade.onrender.com` (após deploy)
- **Dashboard Render:** https://dashboard.render.com
- **GitHub Repositório:** `https://github.com/SEU_USUARIO/minigames-arcade`

---

## Troubleshooting

**❌ "Deploy failed"**
- Verifique `render.yaml` está na raiz
- Verifique `requirements.txt` tem `gunicorn`
- Verifique `app.py` tem `host='0.0.0.0'`

**❌ Mudanças não aparecem**
- Verifique se fez `git push`
- Verifique no dashboard do Render se há novo deploy
- Aguarde ~1 min e limpe cache do navegador (Ctrl+Shift+Del)

**❌ Banco de dados não persiste**
- SQLite funciona em Render, mas a cada restart do serviço (é raro)
- Considere migrar para PostgreSQL gratuito depois

---

## Créditos

Sistema de jogos multiplayer com autenticação e ranking em tempo real. 🎮
