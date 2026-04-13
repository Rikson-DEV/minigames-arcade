// ==================== AUTENTICAÇÃO ====================

function mudarAba(aba) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${aba}-form`).classList.add('active');
    event.target.classList.add('active');
    
    // Limpar campos de erro
    document.getElementById(`${aba}-erro`).textContent = '';
}

// ==================== PASSWORD STRENGTH ==================== 
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function validarSenhaRealtime(senha) {
    if (!senha) {
        document.getElementById('password-strength').classList.remove('active');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/validar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha })
        });
        
        const data = await response.json();
        atualizarIndicadorForca(data);
    } catch (err) {
        console.error('Erro ao validar senha:', err);
    }
}

function atualizarIndicadorForca(data) {
    const container = document.getElementById('password-strength');
    const meter = document.getElementById('strength-meter');
    const text = document.getElementById('strength-text');
    const requirements = document.getElementById('strength-requirements');
    
    container.classList.add('active');
    
    // Mapear força para porcentagem e cores
    const forcaMap = {
        'Muito Fraca': { pct: 20, class: 'muito-fraca' },
        'Fraca': { pct: 40, class: 'fraca' },
        'Média': { pct: 60, class: 'media' },
        'Boa': { pct: 80, class: 'boa' },
        'Muito Boa': { pct: 90, class: 'muito-boa' },
        'Excelente': { pct: 100, class: 'excelente' }
    };
    
    const forca = data.forca;
    const config = forcaMap[forca] || { pct: 0, class: 'muito-fraca' };
    
    meter.style.width = config.pct + '%';
    meter.style.background = getColorByClass(config.class);
    
    text.textContent = forca;
    text.className = 'strength-text ' + config.class;
    
    // Atualizar requisitos
    requirements.innerHTML = '';
    data.erros.forEach(erro => {
        const li = document.createElement('li');
        li.textContent = erro;
        li.className = 'error';
        requirements.appendChild(li);
    });
    
    // Adicionar requisitos atendidos
    if (!data.erros.includes('Mínimo 8 caracteres')) {
        const li = document.createElement('li');
        li.textContent = 'Mínimo 8 caracteres';
        li.className = 'ok';
        requirements.appendChild(li);
    }
    if (!data.erros.includes('Exigido: letra maiúscula')) {
        const li = document.createElement('li');
        li.textContent = 'Letra maiúscula';
        li.className = 'ok';
        requirements.appendChild(li);
    }
    if (!data.erros.includes('Exigido: letra minúscula')) {
        const li = document.createElement('li');
        li.textContent = 'Letra minúscula';
        li.className = 'ok';
        requirements.appendChild(li);
    }
    if (!data.erros.includes('Exigido: número')) {
        const li = document.createElement('li');
        li.textContent = 'Número';
        li.className = 'ok';
        requirements.appendChild(li);
    }
}

function getColorByClass(cls) {
    const colors = {
        'muito-fraca': '#dc3545',
        'fraca': '#fd7e14',
        'media': '#ffc107',
        'boa': '#28a745',
        'muito-boa': '#17a2b8',
        'excelente': '#20c997'
    };
    return colors[cls] || '#dc3545';
}

function fazerLogin() {
    const username = document.getElementById('login-username').value.trim();
    const senha = document.getElementById('login-senha').value;
    const erroEl = document.getElementById('login-erro');
    
    if (!username || !senha) {
        erroEl.textContent = '⚠️ Preencha todos os campos!';
        return;
    }
    
    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, senha })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            localStorage.setItem('user', JSON.stringify({
                token: data.token,
                usuario_id: data.usuario_id,
                username: data.username,
                modo: 'login'
            }));
            window.location.href = '/menu';
        } else {
            erroEl.textContent = '❌ ' + data.erro;
        }
    })
    .catch(() => erroEl.textContent = '❌ Erro de conexão');
}

function fazerRegistro() {
    const username = document.getElementById('registro-username').value.trim();
    const senha = document.getElementById('registro-senha').value;
    const confirma = document.getElementById('registro-confirma').value;
    const erroEl = document.getElementById('registro-erro');
    
    if (!username || !senha || !confirma) {
        erroEl.textContent = '⚠️ Preencha todos os campos!';
        return;
    }
    
    if (username.length < 3) {
        erroEl.textContent = '⚠️ Username deve ter pelo menos 3 caracteres!';
        return;
    }
    
    if (senha !== confirma) {
        erroEl.textContent = '⚠️ As senhas não conferem!';
        return;
    }
    
    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, senha })
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            localStorage.setItem('user', JSON.stringify({
                token: data.token,
                usuario_id: data.usuario_id,
                username: data.username,
                modo: 'login'
            }));
            window.location.href = '/menu';
        } else {
            erroEl.textContent = '❌ ' + data.erro;
        }
    })
    .catch(() => erroEl.textContent = '❌ Erro de conexão');
}

function jogarComoGuest() {
    localStorage.setItem('user', JSON.stringify({
        modo: 'guest',
        username: 'Guest_' + Math.random().toString(36).substr(2, 5).toUpperCase()
    }));
    window.location.href = '/menu';
}

// ==================== EVENT LISTENERS ====================
// Validação em tempo real da senha
document.addEventListener('DOMContentLoaded', () => {
    const senhaInput = document.getElementById('registro-senha');
    if (senhaInput) {
        senhaInput.addEventListener('keyup', (e) => {
            validarSenhaRealtime(e.target.value);
        });
    }

    const novaSenhaInput = document.getElementById('nova-senha');
    if (novaSenhaInput) {
        novaSenhaInput.addEventListener('keyup', (e) => {
            validarSenhaRealtimeReset(e.target.value);
        });
    }
});

// ==================== RECUPERAÇÃO DE SENHA ====================
let adminToken = null;

async function autenticarAdmin() {
    const username = document.getElementById('admin-username').value.trim();
    const senha = document.getElementById('admin-senha').value;
    const erroEl = document.getElementById('admin-erro');
    
    if (!username || !senha) {
        erroEl.textContent = '⚠️ Preencha username e senha!';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            adminToken = data.admin_token;
            document.getElementById('passo1').style.display = 'none';
            document.getElementById('passo2').style.display = 'flex';
            erroEl.textContent = '';
        } else {
            erroEl.textContent = '❌ ' + data.erro;
        }
    } catch (err) {
        erroEl.textContent = '❌ Erro de conexão';
        console.error(err);
    }
}

async function resetarSenhaAdmin() {
    const usuarioAlvo = document.getElementById('usuario-alvo').value.trim();
    const novaSenha = document.getElementById('nova-senha').value;
    const erroEl = document.getElementById('reset-erro');
    
    if (!usuarioAlvo || !novaSenha) {
        erroEl.textContent = '⚠️ Preencha todos os campos!';
        return;
    }
    
    if (!adminToken) {
        erroEl.textContent = '⚠️ Autenticação de admin expirou!';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/resetar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_token: adminToken,
                username: usuarioAlvo,
                nova_senha: novaSenha
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            erroEl.textContent = '';
            alert('✅ Senha resetada com sucesso para: ' + usuarioAlvo);
            voltarRecuperacao();
            mudarAba('login');
        } else {
            erroEl.textContent = '❌ ' + (data.erro || data.detalhes?.[0] || 'Erro ao resetar');
        }
    } catch (err) {
        erroEl.textContent = '❌ Erro de conexão';
        console.error(err);
    }
}

function voltarRecuperacao() {
    adminToken = null;
    document.getElementById('passo1').style.display = 'flex';
    document.getElementById('passo2').style.display = 'none';
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-senha').value = '';
    document.getElementById('usuario-alvo').value = '';
    document.getElementById('nova-senha').value = '';
    document.getElementById('admin-erro').textContent = '';
    document.getElementById('reset-erro').textContent = '';
    document.getElementById('password-strength-reset').classList.remove('active');
}

async function validarSenhaRealtimeReset(senha) {
    if (!senha) {
        document.getElementById('password-strength-reset').classList.remove('active');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/validar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha })
        });
        
        const data = await response.json();
        atualizarIndicadorForcaReset(data);
    } catch (err) {
        console.error('Erro ao validar senha:', err);
    }
}

function atualizarIndicadorForcaReset(data) {
    const container = document.getElementById('password-strength-reset');
    const meter = document.getElementById('strength-meter-reset');
    const text = document.getElementById('strength-text-reset');
    const requirements = document.getElementById('strength-requirements-reset');
    
    container.classList.add('active');
    
    const forcaMap = {
        'Muito Fraca': { pct: 20, class: 'muito-fraca' },
        'Fraca': { pct: 40, class: 'fraca' },
        'Média': { pct: 60, class: 'media' },
        'Boa': { pct: 80, class: 'boa' },
        'Muito Boa': { pct: 90, class: 'muito-boa' },
        'Excelente': { pct: 100, class: 'excelente' }
    };
    
    const forca = data.forca;
    const config = forcaMap[forca] || { pct: 0, class: 'muito-fraca' };
    
    meter.style.width = config.pct + '%';
    meter.style.background = getColorByClass(config.class);
    
    text.textContent = forca;
    text.className = 'strength-text ' + config.class;
    
    requirements.innerHTML = '';
    data.erros.forEach(erro => {
        const li = document.createElement('li');
        li.textContent = erro;
        li.className = 'error';
        requirements.appendChild(li);
    });
    
    if (!data.erros.includes('Mínimo 8 caracteres')) {
        const li = document.createElement('li');
        li.textContent = 'Mínimo 8 caracteres';
        li.className = 'ok';
        requirements.appendChild(li);
    }
    if (!data.erros.includes('Deve conter maiúscula (A-Z)')) {
        const li = document.createElement('li');
        li.textContent = 'Letra maiúscula';
        li.className = 'ok';
        requirements.appendChild(li);
    }
    if (!data.erros.includes('Deve conter minúscula (a-z)')) {
        const li = document.createElement('li');
        li.textContent = 'Letra minúscula';
        li.className = 'ok';
        requirements.appendChild(li);
    }
    if (!data.erros.includes('Deve conter número (0-9)')) {
        const li = document.createElement('li');
        li.textContent = 'Número';
        li.className = 'ok';
        requirements.appendChild(li);
    }
}

// Permitir Enter nas abas
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const form = document.querySelector('.tab-content.active');
        if (form.id === 'login-form') fazerLogin();
        else if (form.id === 'registro-form') fazerRegistro();
        else if (form.id === 'recuperacao-form') {
            if (document.getElementById('passo1').style.display !== 'none') {
                autenticarAdmin();
            } else {
                resetarSenhaAdmin();
            }
        }
    }
});
