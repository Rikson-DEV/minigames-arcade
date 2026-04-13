from flask import Flask, render_template, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
import secrets
from datetime import datetime, timedelta
import jwt
import re

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), "minigames.db")

def criar_banco_dados():
    """Cria o banco de dados com as tabelas necessárias"""
    try:
        conexao = sqlite3.connect(DB_PATH)
        cursor = conexao.cursor()
        
        # Tabela de usuários
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                tipo_usuario TEXT DEFAULT 'comum',
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Adicionar coluna tipo_usuario se não existir (migration)
        try:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN tipo_usuario TEXT DEFAULT 'comum'")
        except sqlite3.OperationalError:
            pass  # Coluna já existe
        
        # Tabela de scores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                jogo TEXT NOT NULL,
                pontuacao INTEGER NOT NULL,
                dificuldade_inicial INTEGER NOT NULL,
                dificuldade_final INTEGER NOT NULL,
                data_jogo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        """)
        
        conexao.commit()
        print(f"✓ Banco de dados criado em: {DB_PATH}")
        
        # Criar/atualizar usuários admin
        _criar_admins_padrao(conexao, cursor)
        
        conexao.close()
        print("✓ Tabelas criadas e admins configurados")
    except Exception as e:
        print(f"❌ ERRO ao criar banco de dados: {e}")
        raise

def _criar_admins_padrao(conexao, cursor):
    """Cria ou atualiza usuários admin (admin e Rickstiller)"""
    try:
        admins = [
            ('admin', 'admin'),
            ('Rickstiller', 'Rickstiller123!')
        ]
        
        for username, senha in admins:
            try:
                # Verificar se já existe
                cursor.execute("SELECT id, tipo_usuario FROM usuarios WHERE username = ?", (username,))
                usuario = cursor.fetchone()
                
                if usuario:
                    # Atualizar para admin se não for
                    if usuario[1] != 'admin':
                        cursor.execute(
                            "UPDATE usuarios SET tipo_usuario = ? WHERE username = ?",
                            ('admin', username)
                        )
                        conexao.commit()
                        print(f"✓ Usuário {username} atualizado para admin")
                else:
                    # Criar novo admin
                    cursor.execute(
                        "INSERT INTO usuarios (username, senha, tipo_usuario) VALUES (?, ?, ?)",
                        (username, generate_password_hash(senha), 'admin')
                    )
                    conexao.commit()
                    print(f"✓ Admin {username} criado com sucesso")
            except Exception as e:
                print(f"❌ Erro ao processar admin {username}: {e}")
    except Exception as e:
        print(f"❌ Erro ao criar admins padrão: {e}")

def get_db():
    """Retorna conexão com banco de dados"""
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    return conexao

def validar_forca_senha(senha):
    """
    Valida força da senha seguindo NIST 2021
    Retorna: (é_válida, mensagens_erro, força)
    """
    erros = []
    
    if len(senha) < 8:
        erros.append("Mínimo 8 caracteres")
    
    if not re.search(r'[A-Z]', senha):
        erros.append("Deve conter maiúscula (A-Z)")
    
    if not re.search(r'[a-z]', senha):
        erros.append("Deve conter minúscula (a-z)")
    
    if not re.search(r'[0-9]', senha):
        erros.append("Deve conter número (0-9)")
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:,.<>?/]', senha):
        erros.append("Recomendado: caractere especial (!@#$%^&*)")
    
    # Calcular força
    forca = 0
    if len(senha) >= 12: forca += 1
    if len(senha) >= 16: forca += 1
    if re.search(r'[A-Z]', senha): forca += 1
    if re.search(r'[a-z]', senha): forca += 1
    if re.search(r'[0-9]', senha): forca += 1
    if re.search(r'[!@#$%^&*()_+\-=\[\]{};:,.<>?/]', senha): forca += 1
    
    estrutura_forca = {
        0: "Muito Fraca",
        1: "Fraca",
        2: "Fraca",
        3: "Média",
        4: "Forte",
        5: "Muito Forte",
        6: "Excelente"
    }
    
    valida = len(erros) == 0
    return valida, erros, estrutura_forca.get(min(forca, 6))

@app.route('/api/auth/validar-senha', methods=['POST'])
def validar_senha_endpoint():
    """Valida força de senha em tempo real"""
    try:
        data = request.json
        senha = data.get('senha', '')
        
        valida, erros, forca = validar_forca_senha(senha)
        
        return jsonify({
            "valida": valida,
            "forca": forca,
            "erros": erros
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ==================== AUTENTICAÇÃO ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registra novo usuário"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        senha = data.get('senha', '').strip()
        
        if not username or len(username) < 3:
            return jsonify({"erro": "Username deve ter pelo menos 3 caracteres"}), 400
        
        # Validar força de senha
        valida, erros, forca = validar_forca_senha(senha)
        if not valida:
            return jsonify({
                "erro": "Senha fraca",
                "detalhes": erros,
                "forca": forca
            }), 400
        
        conexao = get_db()
        cursor = conexao.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO usuarios (username, senha, tipo_usuario) VALUES (?, ?, ?)",
                (username, generate_password_hash(senha), 'comum')
            )
            conexao.commit()
            usuario_id = cursor.lastrowid
            conexao.close()
            
            token = jwt.encode(
                {"usuario_id": usuario_id, "exp": datetime.utcnow() + timedelta(days=30)},
                app.secret_key,
                algorithm="HS256"
            )
            
            return jsonify({
                "sucesso": True,
                "token": token,
                "usuario_id": usuario_id,
                "username": username
            })
        except sqlite3.IntegrityError:
            conexao.close()
            return jsonify({"erro": "Username já existe"}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Autentica usuário existente"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        senha = data.get('senha', '').strip()
        
        conexao = get_db()
        cursor = conexao.cursor()
        cursor.execute("SELECT id, senha FROM usuarios WHERE username = ?", (username,))
        usuario = cursor.fetchone()
        conexao.close()
        
        if not usuario or not check_password_hash(usuario['senha'], senha):
            return jsonify({"erro": "Username ou senha inválidos"}), 401
        
        token = jwt.encode(
            {"usuario_id": usuario['id'], "exp": datetime.utcnow() + timedelta(days=30)},
            app.secret_key,
            algorithm="HS256"
        )
        
        return jsonify({
            "sucesso": True,
            "token": token,
            "usuario_id": usuario['id'],
            "username": username
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

def verificar_token(token):
    """Verifica e decodifica token JWT"""
    try:
        payload = jwt.decode(token, app.secret_key, algorithms=["HS256"])
        return payload.get('usuario_id')
    except:
        return None

# ==================== RECUPERAÇÃO DE SENHA ====================

@app.route('/api/auth/admin-login', methods=['POST'])
def admin_login():
    """Autentica usuario admin (admin ou Rickstiller com suas senhas)"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        senha = data.get('senha', '').strip()
        
        conexao = get_db()
        cursor = conexao.cursor()
        cursor.execute(
            "SELECT id, senha, tipo_usuario FROM usuarios WHERE username = ?",
            (username,)
        )
        usuario = cursor.fetchone()
        conexao.close()
        
        if not usuario or not check_password_hash(usuario['senha'], senha):
            return jsonify({"erro": "Username ou senha inválidos"}), 401
        
        if usuario['tipo_usuario'] != 'admin':
            return jsonify({"erro": "Usuário não é administrador"}), 403
        
        return jsonify({
            "sucesso": True,
            "admin_token": jwt.encode(
                {
                    "admin": True,
                    "usuario_id": usuario['id'],
                    "username": username,
                    "exp": datetime.utcnow() + timedelta(hours=1)
                },
                app.secret_key,
                algorithm="HS256"
            )
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/auth/resetar-senha', methods=['POST'])
def resetar_senha():
    """Reseta senha de usuário (requer autenticação de admin)"""
    try:
        data = request.json
        admin_token = data.get('admin_token')
        username_alvo = data.get('username', '').strip()
        nova_senha = data.get('nova_senha', '').strip()
        
        # Verificar se é admin
        try:
            payload = jwt.decode(admin_token, app.secret_key, algorithms=["HS256"])
            if not payload.get('admin'):
                return jsonify({"erro": "Token de admin inválido"}), 401
        except:
            return jsonify({"erro": "Não autorizado como admin"}), 401
        
        if not username_alvo or not nova_senha:
            return jsonify({"erro": "Username e nova senha são obrigatórios"}), 400
        
        # Validar força de senha
        valida, erros, forca = validar_forca_senha(nova_senha)
        if not valida:
            return jsonify({
                "erro": "Senha fraca",
                "detalhes": erros,
                "forca": forca
            }), 400
        
        conexao = get_db()
        cursor = conexao.cursor()
        
        # Verificar se usuário existe
        cursor.execute("SELECT id FROM usuarios WHERE username = ?", (username_alvo,))
        usuario = cursor.fetchone()
        
        if not usuario:
            conexao.close()
            return jsonify({"erro": "Usuário não encontrado"}), 404
        
        # Atualizar senha
        cursor.execute(
            "UPDATE usuarios SET senha = ? WHERE username = ?",
            (generate_password_hash(nova_senha), username_alvo)
        )
        conexao.commit()
        conexao.close()
        
        return jsonify({
            "sucesso": True,
            "mensagem": f"Senha de {username_alvo} resetada com sucesso"
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ==================== SCORES ====================

@app.route('/api/scores/salvar', methods=['POST'])
def salvar_score():
    """Salva score de um jogo"""
    try:
        data = request.json
        token = data.get('token')
        usuario_id = verificar_token(token)
        
        if not usuario_id:
            return jsonify({"erro": "Não autenticado"}), 401
        
        jogo = data.get('jogo')
        pontuacao = data.get('pontuacao')
        dificuldade_inicial = data.get('dificuldade_inicial')
        dificuldade_final = data.get('dificuldade_final')
        
        if not all([jogo, type(pontuacao) == int, dificuldade_inicial, dificuldade_final]):
            return jsonify({"erro": "Dados incompletos"}), 400
        
        conexao = get_db()
        cursor = conexao.cursor()
        cursor.execute(
            """INSERT INTO scores (usuario_id, jogo, pontuacao, dificuldade_inicial, dificuldade_final)
               VALUES (?, ?, ?, ?, ?)""",
            (usuario_id, jogo, pontuacao, dificuldade_inicial, dificuldade_final)
        )
        conexao.commit()
        conexao.close()
        
        return jsonify({"sucesso": True})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/scores/pessoais/<int:usuario_id>/<jogo>', methods=['GET'])
def get_scores_pessoais(usuario_id, jogo):
    """Retorna scores pessoais de um jogo específico"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if verificar_token(token) != usuario_id:
            return jsonify({"erro": "Não autorizado"}), 401
        
        conexao = get_db()
        cursor = conexao.cursor()
        cursor.execute(
            """SELECT pontuacao, dificuldade_inicial, dificuldade_final, data_jogo
               FROM scores WHERE usuario_id = ? AND jogo = ?
               ORDER BY pontuacao DESC LIMIT 10""",
            (usuario_id, jogo)
        )
        scores = [dict(row) for row in cursor.fetchall()]
        
        # Melhor score
        cursor.execute(
            "SELECT MAX(pontuacao) as melhor FROM scores WHERE usuario_id = ? AND jogo = ?",
            (usuario_id, jogo)
        )
        melhor = cursor.fetchone()['melhor'] or 0
        
        conexao.close()
        
        return jsonify({
            "scores": scores,
            "melhor_score": melhor,
            "total_partidas": len(scores)
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/scores/ranking/<jogo>', methods=['GET'])
def get_ranking_global(jogo):
    """Retorna ranking global de um jogo"""
    try:
        conexao = get_db()
        cursor = conexao.cursor()
        cursor.execute(
            """SELECT u.username, MAX(s.pontuacao) as melhor_score, COUNT(s.id) as total_partidas
               FROM usuarios u
               LEFT JOIN scores s ON u.id = s.usuario_id AND s.jogo = ?
               GROUP BY u.id, u.username
               ORDER BY melhor_score DESC
               LIMIT 100""",
            (jogo,)
        )
        ranking = [dict(row) for row in cursor.fetchall()]
        conexao.close()
        
        return jsonify({
            "ranking": ranking,
            "jogo": jogo
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ==================== ROTAS HTML ====================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/games')
def games():
    return render_template('games.html')

@app.route('/ranking')
def ranking():
    return render_template('ranking.html')

if __name__ == '__main__':
    criar_banco_dados()
    print("="*60)
    print("🎮 MINIGAMES ARCADE - Sistema de Jogos")
    print("="*60)
    print("✓ Banco de dados criado/verificado")
    print("✓ Servidor online!")
    print("="*60)
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
