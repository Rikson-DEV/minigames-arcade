// ==================== BASE CLASS ====================

class BaseGame {
    constructor(dificuldade) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dificuldade = dificuldade;
        this.dificuldadeFinal = dificuldade;
        this.rodando = false;
        this.pontuacao = 0;
        
        // ==================== MOBILE RESPONSIVENESS ====================
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        // Dimensões do canvas - Adaptado para mobile
        const container = document.getElementById('game-area');
        if (this.isMobile) {
            // Mobile: usar 90% da largura disponível
            this.canvas.width = Math.min(container.offsetWidth - 20, window.innerWidth - 20);
            this.canvas.height = Math.min(600, window.innerHeight - 200);
        } else {
            // Desktop: tamanho fixo
            this.canvas.width = Math.min(container.offsetWidth - 40, 800);
            this.canvas.height = 600;
        }
        
        // Set canvas style para evitar distorção
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.display = 'block';
        
        // Inicializar event listeners de touch
        this.initializeTouchControls();
    }
    
    initializeTouchControls() {
        // Adiciona suporte para touch em mobile
        if (this.isMobile) {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
            this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].clientX;
        this.touchStartY = e.changedTouches[0].clientY;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        this.handleSwipe();
    }
    
    handleSwipe() {
        // Detecta direção do swipe - Implementado em subclasses
        // Será sobrescrito em Snake, Pong, SpaceShooter
    }
    
    start() {
        this.rodando = true;
        this.gameLoop();
    }
    
    parar() {
        this.rodando = false;
    }
    
    atualizarHUD() {
        document.getElementById('score').textContent = this.pontuacao;
        document.getElementById('difficulty').textContent = this.dificuldadeFinal;
    }
    
    gameOver() {
        this.parar();
        encerrarJogo(this.pontuacao, this.dificuldadeFinal);
    }
}

// ==================== SNAKE ====================

class Snake extends BaseGame {
    constructor(dificuldade) {
        super(dificuldade);
        this.tamanhoGrid = 20;
        this.serpente = [{ x: 10, y: 10 }];
        this.comida = this.gerarComida();
        this.direcao = { x: 1, y: 0 };
        this.proximaDirecao = { x: 1, y: 0 };
        this.velocidade = 14 - (dificuldade * 3); // Dif 1 = 11, Dif 2 = 8, Dif 3 = 5, Dif 4 = 2
        this.intervaloAtualizacao = 0;
        
        document.addEventListener('keydown', (e) => this.mudarDirecao(e));
    }
    
    handleSwipe() {
        // Detecta swipe no mobile e muda direção do snake
        const diferencaX = this.touchEndX - this.touchStartX;
        const diferencaY = this.touchEndY - this.touchStartY;
        const minSwipe = 50; // Distância mínima para considerar um swipe
        
        if (Math.abs(diferencaX) > Math.abs(diferencaY)) {
            // Swipe horizontal
            if (diferencaX > minSwipe && this.direcao.x === 0) {
                this.proximaDirecao = { x: 1, y: 0 }; // Direita
            } else if (diferencaX < -minSwipe && this.direcao.x === 0) {
                this.proximaDirecao = { x: -1, y: 0 }; // Esquerda
            }
        } else {
            // Swipe vertical
            if (diferencaY > minSwipe && this.direcao.y === 0) {
                this.proximaDirecao = { x: 0, y: 1 }; // Baixo
            } else if (diferencaY < -minSwipe && this.direcao.y === 0) {
                this.proximaDirecao = { x: 0, y: -1 }; // Cima
            }
        }
    }
    
    gerarComida() {
        let novaComida;
        let valida = false;
        while (!valida) {
            novaComida = {
                x: Math.floor(Math.random() * (this.canvas.width / this.tamanhoGrid)),
                y: Math.floor(Math.random() * (this.canvas.height / this.tamanhoGrid))
            };
            valida = !this.serpente.some(seg => seg.x === novaComida.x && seg.y === novaComida.y);
        }
        return novaComida;
    }
    
    mudarDirecao(e) {
        if (!this.rodando) return;
        
        const teclas = {
            'ArrowUp': { x: 0, y: -1 },
            'ArrowDown': { x: 0, y: 1 },
            'ArrowLeft': { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 },
            'w': { x: 0, y: -1 },
            's': { x: 0, y: 1 },
            'a': { x: -1, y: 0 },
            'd': { x: 1, y: 0 }
        };
        
        const direcao = teclas[e.key.toLowerCase()];
        if (!direcao) return;
        
        // Evitar reverter
        if (this.direcao.x + direcao.x === 0 && this.direcao.y + direcao.y === 0) return;
        
        this.proximaDirecao = direcao;
        e.preventDefault();
    }
    
    atualizar() {
        this.intervaloAtualizacao++;
        if (this.intervaloAtualizacao < this.velocidade) return;
        this.intervaloAtualizacao = 0;
        
        this.direcao = this.proximaDirecao;
        
        const cabeca = {
            x: this.serpente[0].x + this.direcao.x,
            y: this.serpente[0].y + this.direcao.y
        };
        
        // Verificar colisão com parede
        if (cabeca.x < 0 || cabeca.x >= this.canvas.width / this.tamanhoGrid ||
            cabeca.y < 0 || cabeca.y >= this.canvas.height / this.tamanhoGrid) {
            this.gameOver();
            return;
        }
        
        // Verificar colisão consigo mesma
        if (this.serpente.some(seg => seg.x === cabeca.x && seg.y === cabeca.y)) {
            this.gameOver();
            return;
        }
        
        this.serpente.unshift(cabeca);
        
        // Comer comida
        if (cabeca.x === this.comida.x && cabeca.y === this.comida.y) {
            this.pontuacao += 10;
            this.dificuldadeFinal = Math.floor(this.dificuldade + (this.pontuacao / 100) * this.dificuldade);
            this.comida = this.gerarComida();
        } else {
            this.serpente.pop();
        }
        
        this.atualizarHUD();
    }
    
    desenhar() {
        // Fundo
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.canvas.width; i += this.tamanhoGrid) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.canvas.height; i += this.tamanhoGrid) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // Serpente
        this.serpente.forEach((seg, idx) => {
            this.ctx.fillStyle = idx === 0 ? '#00ff00' : '#00cc00';
            this.ctx.fillRect(
                seg.x * this.tamanhoGrid + 1,
                seg.y * this.tamanhoGrid + 1,
                this.tamanhoGrid - 2,
                this.tamanhoGrid - 2
            );
        });
        
        // Comida
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.comida.x * this.tamanhoGrid + 1,
            this.comida.y * this.tamanhoGrid + 1,
            this.tamanhoGrid - 2,
            this.tamanhoGrid - 2
        );
    }
    
    gameLoop() {
        if (!this.rodando) return;
        
        this.atualizar();
        this.desenhar();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ==================== PONG ====================

class Pong extends BaseGame {
    constructor(dificuldade) {
        super(dificuldade);
        this.paddleAltura = 100;
        this.paddleLargura = 10;
        this.paddleJogador = { x: 20, y: this.canvas.height / 2 - this.paddleAltura / 2 };
        this.paddleIA = { x: this.canvas.width - 30, y: this.canvas.height / 2 - this.paddleAltura / 2 };
        this.bola = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: 3,
            vy: 3,
            raio: 8
        };
        this.velocidadeJogador = 5;
        this.velocidadeIA = 3.5;
        this.vidas = 3;
        this.teclasPresinoadas = {};
        
        document.addEventListener('mousemove', (e) => this.atualizarMouse(e));
        document.addEventListener('keydown', (e) => {
            this.teclasPresinoadas[e.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', (e) => {
            this.teclasPresinoadas[e.key.toLowerCase()] = false;
        });
    }
    
    handleSwipe() {
        // Detecta swipe no mobile e move paddle
        const diferencaY = this.touchEndY - this.touchStartY;
        const minSwipe = 30;
        
        if (diferencaY < -minSwipe) {
            // Swipe para cima
            this.paddleJogador.y = Math.max(0, this.paddleJogador.y - 50);
        } else if (diferencaY > minSwipe) {
            // Swipe para baixo
            this.paddleJogador.y = Math.min(
                this.canvas.height - this.paddleAltura,
                this.paddleJogador.y + 50
            );
        }
    }
    
    atualizarMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.paddleJogador.y = e.clientY - rect.top - this.paddleAltura / 2;
    }
    
    atualizar() {
        // Movimento do paddle jogador por teclado
        if (this.teclasPresinoadas['ArrowUp'] || this.teclasPresinoadas['w']) {
            this.paddleJogador.y -= this.velocidadeJogador;
        }
        if (this.teclasPresinoadas['ArrowDown'] || this.teclasPresinoadas['s']) {
            this.paddleJogador.y += this.velocidadeJogador;
        }
        
        // Limitar movimento do paddle
        this.paddleJogador.y = Math.max(0, Math.min(this.canvas.height - this.paddleAltura, this.paddleJogador.y));
        this.paddleIA.y = Math.max(0, Math.min(this.canvas.height - this.paddleAltura, this.paddleIA.y));
        
        // Aumentar velocidade conforme dificuldade
        const velocidadeBase = 2 + (this.dificuldade * 0.7);
        this.bola.vx = (this.bola.vx > 0 ? 1 : -1) * velocidadeBase;
        this.bola.vy = (this.bola.vy > 0 ? 1 : -1) * Math.min(Math.abs(this.bola.vy), velocidadeBase * 1.2);
        
        // Mover bola
        this.bola.x += this.bola.vx;
        this.bola.y += this.bola.vy;
        
        // Colisão com topo/bottom
        if (this.bola.y - this.bola.raio < 0 || this.bola.y + this.bola.raio > this.canvas.height) {
            this.bola.vy *= -1;
            this.bola.y = Math.max(this.bola.raio, Math.min(this.canvas.height - this.bola.raio, this.bola.y));
        }
        
        // IA inteligente
        const centerIA = this.paddleIA.y + this.paddleAltura / 2;
        if (centerIA < this.bola.y - 25) this.paddleIA.y += this.velocidadeIA;
        else if (centerIA > this.bola.y + 25) this.paddleIA.y -= this.velocidadeIA;
        
        // Colisão com paddle do jogador
        if (this.colidiuPaddle(this.bola, this.paddleJogador)) {
            this.bola.vx = Math.abs(this.bola.vx) * 1.05; // Aumenta velocidade um pouco
            this.bola.x = this.paddleJogador.x + this.paddleLargura + this.bola.raio;
            
            // Física: O ponto de contato determina o ângulo
            const impactoRelativo = (this.bola.y - this.paddleJogador.y) / this.paddleAltura - 0.5;
            this.bola.vy = impactoRelativo * 6; // Vy varia de -3 a 3 conforme onde bate
            
            this.pontuacao += 10;
        }
        
        // Colisão com paddle da IA
        if (this.colidiuPaddle(this.bola, this.paddleIA)) {
            this.bola.vx = -Math.abs(this.bola.vx) * 1.05;
            this.bola.x = this.paddleIA.x - this.bola.raio;
            
            // Mesma física para IA
            const impactoRelativo = (this.bola.y - this.paddleIA.y) / this.paddleAltura - 0.5;
            this.bola.vy = impactoRelativo * 6;
        }
        
        // Jogador perde - bola sai pela esquerda
        if (this.bola.x < 0) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.gameOver();
                return;
            }
            this.resetarBola();
        }
        
        // IA perde - pontos para jogador
        if (this.bola.x > this.canvas.width) {
            this.pontuacao += 50;
            this.resetarBola();
        }
        
        this.dificuldadeFinal = Math.floor(this.dificuldade + (this.pontuacao / 150) * this.dificuldade);
        document.getElementById('lives').textContent = this.vidas;
        this.atualizarHUD();
    }
    
    colidiuPaddle(bola, paddle) {
        return bola.x - bola.raio < paddle.x + this.paddleLargura &&
               bola.x + bola.raio > paddle.x &&
               bola.y - bola.raio < paddle.y + this.paddleAltura &&
               bola.y + bola.raio > paddle.y;
    }
    
    resetarBola() {
        this.bola.x = this.canvas.width / 2;
        this.bola.y = this.canvas.height / 2;
        const velocidadeBase = 2 + (this.dificuldade * 0.7);
        this.bola.vx = (Math.random() > 0.5 ? 1 : -1) * velocidadeBase;
        this.bola.vy = (Math.random() - 0.5) * velocidadeBase;
    }
    
    desenhar() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Centro pontilhado
        this.ctx.strokeStyle = '#333';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Paddles
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.paddleJogador.x, this.paddleJogador.y, this.paddleLargura, this.paddleAltura);
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillRect(this.paddleIA.x, this.paddleIA.y, this.paddleLargura, this.paddleAltura);
        
        // Bola
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(this.bola.x, this.bola.y, this.bola.raio, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        if (!this.rodando) return;
        
        this.atualizar();
        this.desenhar();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ==================== SPACE SHOOTER ====================

class SpaceShooter extends BaseGame {
    constructor(dificuldade) {
        super(dificuldade);
        this.nave = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 40,
            largura: 30,
            altura: 30,
            velocidade: 6
        };
        this.projéteis = [];
        this.inimigos = [];
        this.velocidadeInimigos = 1 + (dificuldade * 0.5);
        this.taxaSpawnInimigos = 60 - (dificuldade * 12);
        this.contador = 0;
        this.vidas = 3;
        this.teclasPresinoadas = {};
        
        document.addEventListener('keydown', (e) => {
            this.teclasPresinoadas[e.key.toLowerCase()] = true;
            if (e.code === 'Space') this.atirar(e);
        });
        document.addEventListener('keyup', (e) => {
            this.teclasPresinoadas[e.key.toLowerCase()] = false;
        });
    }
    
    handleSwipe() {
        // Detecta swipe no mobile e move nave
        const diferencaX = this.touchEndX - this.touchStartX;
        const minSwipe = 50;
        
        if (diferencaX < -minSwipe) {
            // Swipe para esquerda
            this.nave.x = Math.max(0, this.nave.x - 100);
        } else if (diferencaX > minSwipe) {
            // Swipe para direita
            this.nave.x = Math.min(this.canvas.width - this.nave.largura, this.nave.x + 100);
        }
        
        // Tocar na tela para atirar
        this.atirar();
    }
    
    gerarInimigo() {
        return {
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            largura: 30,
            altura: 30,
            velocidade: this.velocidadeInimigos
        };
    }
    
    moverNave() {
        if (this.teclasPresinoadas['ArrowLeft'] || this.teclasPresinoadas['a']) {
            this.nave.x -= this.nave.velocidade;
        }
        if (this.teclasPresinoadas['ArrowRight'] || this.teclasPresinoadas['d']) {
            this.nave.x += this.nave.velocidade;
        }
        
        this.nave.x = Math.max(0, Math.min(this.canvas.width - this.nave.largura, this.nave.x));
    }
    
    atirar(e) {
        if (this.rodando) {
            this.projéteis.push({
                x: this.nave.x + this.nave.largura / 2,
                y: this.nave.y,
                largura: 5,
                altura: 15,
                velocidade: 7
            });
            e.preventDefault();
        }
    }
    
    atualizar() {
        // Mover nave continuamente
        this.moverNave();
        
        // Gerar inimigos
        this.contador++;
        if (this.contador > this.taxaSpawnInimigos) {
            this.inimigos.push(this.gerarInimigo());
            this.contador = 0;
        }
        
        // Mover e remover projéteis
        for (let i = this.projéteis.length - 1; i >= 0; i--) {
            this.projéteis[i].y -= this.projéteis[i].velocidade;
            if (this.projéteis[i].y < 0) {
                this.projéteis.splice(i, 1);
            }
        }
        
        // Mover e remover inimigos
        for (let i = this.inimigos.length - 1; i >= 0; i--) {
            this.inimigos[i].y += this.inimigos[i].velocidade;
            
            // Colisão com nave
            if (this.colidiu(this.inimigos[i], this.nave)) {
                this.vidas--;
                this.inimigos.splice(i, 1);
                if (this.vidas <= 0) {
                    this.gameOver();
                    return;
                }
                continue;
            }
            
            // Remover se saiu da tela
            if (this.inimigos[i].y > this.canvas.height) {
                this.inimigos.splice(i, 1);
            }
        }
        
        // Colisões projéteis x inimigos
        for (let i = this.projéteis.length - 1; i >= 0; i--) {
            for (let j = this.inimigos.length - 1; j >= 0; j--) {
                if (this.colidiu(this.projéteis[i], this.inimigos[j])) {
                    this.pontuacao += 100;
                    this.projéteis.splice(i, 1);
                    this.inimigos.splice(j, 1);
                    break;
                }
            }
        }
        
        this.dificuldadeFinal = Math.floor(this.dificuldade + (this.pontuacao / 500) * this.dificuldade);
        document.getElementById('lives').textContent = this.vidas;
        this.atualizarHUD();
    }
    
    colidiu(obj1, obj2) {
        return obj1.x < obj2.x + obj2.largura &&
               obj1.x + obj1.largura > obj2.x &&
               obj1.y < obj2.y + obj2.altura &&
               obj1.y + obj1.altura > obj2.y;
    }
    
    desenhar() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Estrelas de fundo
        this.ctx.fillStyle = '#888';
        for (let i = 0; i < 100; i++) {
            const x = (i * 7) % this.canvas.width;
            const y = (i * 13) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Nave
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.nave.x, this.nave.y, this.nave.largura, this.nave.altura);
        
        // Projéteis
        this.ctx.fillStyle = '#ffff00';
        this.projéteis.forEach(proj => {
            this.ctx.fillRect(proj.x, proj.y, proj.largura, proj.altura);
        });
        
        // Inimigos
        this.ctx.fillStyle = '#ff0000';
        this.inimigos.forEach(inim => {
            this.ctx.fillRect(inim.x, inim.y, inim.largura, inim.altura);
        });
    }
    
    gameLoop() {
        if (!this.rodando) return;
        
        this.atualizar();
        this.desenhar();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}
