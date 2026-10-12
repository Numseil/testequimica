const App = {
    score: 0,
    level: "Auxiliar de Laboratório",

    init() {
        const savedScore = localStorage.getItem('labquimica_score');
        if (savedScore !== null) {
            this.score = parseInt(savedScore, 10);
            this.updateLevelDisplay();
        }
    },

    goToScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if(target) {
            target.classList.add('active');
        } else {
            console.error("Tela não encontrada:", screenId);
        }
    },

    addScore(points) {
        this.score += points;
        localStorage.setItem('labquimica_score', this.score);
        this.updateLevelDisplay();
    },

    updateLevelDisplay() {
        const scoreElem = document.getElementById('userScore');
        const levelElem = document.getElementById('userLevel');
        if(scoreElem) scoreElem.innerText = this.score;

        if(this.score >= 100 && this.score < 250) {
            this.level = "Analista Iniciante";
        } else if(this.score >= 250 && this.score < 500) {
            this.level = "Analista Químico";
        } else if(this.score >= 500) {
            this.level = "Especialista em Análises";
        }
        if(levelElem) levelElem.innerText = this.level;
    },

    verifySafety() {
        const j = document.getElementById('epi-jaleco').checked;
        const o = document.getElementById('epi-oculos').checked;
        const c = document.getElementById('epi-calcado').checked;

        if(j && o && c) {
            alert("EPIs verificados com sucesso! Bem-vindo ao laboratório.");
            this.addScore(20);
            this.goToScreen('screen-experiments');
        } else {
            alert("Atenção! Faltam EPIs obrigatórios (Jaleco, Óculos ou Sapatos fechados).");
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 1. BALANÇA ANALÍTICA APERFEIÇOADA
const AnalyticalBalance = {
    isPoweredOn: true,
    container: null,
    solidMass: 0.0000,
    isTared: false,
    tareValue: 0.0000,

    init() {
        App.goToScreen('screen-balance');
        this.updateDisplay();
        this.updatePanel();
    },

    togglePower() {
        this.isPoweredOn = !this.isPoweredOn;
        this.updateDisplay();
    },

    zeroScale() {
        if(!this.isPoweredOn) return;
        this.tareValue = 0.0000;
        this.isTared = false;
        this.updateDisplay();
    },

    tareScale() {
        if(!this.isPoweredOn || !this.container) return;
        const gross = this.container.emptyMass + this.solidMass;
        this.tareValue = gross;
        this.isTared = true;
        this.updateDisplay();
        alert("Balança tarada com sucesso! O visor foi zerado mantendo a carga real.");
    },

    openContainerModal() {
        document.getElementById('containerModal').classList.remove('hidden');
    },

    placeContainer(type, mass, name) {
        this.container = { type, emptyMass: mass, name };
        this.solidMass = 0.0000;
        this.isTared = false;
        this.tareValue = 0.0000;
        document.getElementById('containerModal').classList.add('hidden');
        document.getElementById('btnAddSolidBtn').disabled = false;
        document.getElementById('btnRemoveCont').disabled = false;

        const pan = document.getElementById('weighingPan');
        pan.innerHTML = `<div class="vessel-item">
            <div class="vessel-${type}" id="visualVessel">
                <div class="solid-inside" id="visualSolid" style="height: 0%;"></div>
            </div>
        </div>`;

        this.updateDisplay();
        this.updatePanel();
        App.addScore(10);
    },

    removeContainer() {
        this.container = null;
        this.solidMass = 0.0000;
        this.isTared = false;
        this.tareValue = 0.0000; // Reset da tara ao retirar o recipiente (evita leitura zerada incorreta)
        document.getElementById('weighingPan').innerHTML = '';
        document.getElementById('btnAddSolidBtn').disabled = true;
        document.getElementById('btnRemoveCont').disabled = true;
        this.updateDisplay();
        this.updatePanel();
    },

    openAddSolidModal() {
        if(!this.container) {
            alert("Coloque um recipiente no prato primeiro!");
            return;
        }
        document.getElementById('addSolidModal').classList.remove('hidden');
    },

    closeAddSolidModal() {
        document.getElementById('addSolidModal').classList.add('hidden');
    },

    addSolidIncrement(amount) {
        this.solidMass += amount;
        this.updateVisualSolid();
        this.updateDisplay();
        this.updatePanel();
    },

    removeSomeSolid() {
        if(this.solidMass <= 0) {
            alert("Não há sólido para remover.");
            return;
        }
        this.solidMass = Math.max(0, this.solidMass - 0.1000);
        this.updateVisualSolid();
        this.updateDisplay();
        this.updatePanel();
    },

    removeAllSolid() {
        this.solidMass = 0.0000;
        this.updateVisualSolid();
        this.updateDisplay();
        this.updatePanel();
        alert("Sólido removido do recipiente.");
    },

    updateVisualSolid() {
        const solidDiv = document.getElementById('visualSolid');
        if(solidDiv) {
            const heightPct = Math.min(90, (this.solidMass / 5.0) * 90);
            solidDiv.style.height = `${heightPct}%`;
        }
    },

    getCurrentMass() {
        if (!this.container) return 0.0000;
        return this.container.emptyMass + this.solidMass;
    },

    getDisplayedMass() {
        const gross = this.getCurrentMass();
        return Math.max(0, gross - this.tareValue);
    },

    updateDisplay() {
        const display = document.getElementById('balanceDisplay');
        const status = document.getElementById('balanceStatus');
        if(!this.isPoweredOn) {
            display.innerText = "";
            status.innerText = "DESLIGADO";
            status.style.color = "var(--text-muted)";
            return;
        }
        status.innerText = "ESTÁVEL";
        status.style.color = "var(--emerald)";
        display.innerText = `${this.getDisplayedMass().toFixed(4)} g`;
    },

    updatePanel() {
        document.getElementById('balRecipName').innerText = this.container ? this.container.name : "Nenhum";
        document.getElementById('balRecipMass').innerText = this.container ? `${this.container.emptyMass.toFixed(4)} g` : "0,0000 g";
        document.getElementById('balNetMass').innerText = `${this.solidMass.toFixed(4)} g`;
    }
};

// 3. LABORATÓRIO DE TITULAÇÃO COM SELEÇÃO DE BURETA E FENOLFTALEÍNA GRADUAL
const TitrationLab = {
    buretteCapacity: 50.0,
    buretteCurrent: 0.0,
    volSpent: 0.0,
    isStopcockOpen: false,
    animationInterval: null,
    sampleVol: 25.0,
    cFlask: 0.1000,
    cBurette: 0.1000,
    indicator: 'phenolphthalein',
    flaskSol: 'HCl',
    buretteSol: 'NaOH',

    openConfig() {
        App.goToScreen('screen-titration-config');
    },

    startFromConfig() {
        this.buretteCapacity = parseFloat(document.getElementById('cfgBuretteCapacity').value) || 50.0;
        this.indicator = document.getElementById('cfgIndicator').value;
        this.flaskSol = document.getElementById('cfgFlaskSolution').value;
        this.buretteSol = document.getElementById('cfgBuretteSolution').value;

        this.buretteCurrent = 0.0;
        this.volSpent = 0.0;

        document.getElementById('displayBuretteCap').innerText = `${this.buretteCapacity} mL`;
        document.getElementById('volRemainingDisplay').innerText = `${this.buretteCapacity.toFixed(2)} mL`;

        App.goToScreen('screen-titration');
        this.updateVisuals();
        this.drawGraph();
    },

    toggleStopcock() {
        this.isStopcockOpen = !this.isStopcockOpen;
        const btn = document.getElementById('btnStopcock');
        if(this.isStopcockOpen) {
            btn.innerText = "Fechar Torneira";
            btn.style.backgroundColor = "var(--danger)";
            this.startFlow();
        } else {
            btn.innerText = "Abrir Torneira";
            btn.style.backgroundColor = "var(--emerald)";
            this.stopFlow();
        }
    },

    startFlow() {
        if(this.animationInterval) clearInterval(this.animationInterval);
        this.animationInterval = setInterval(() => {
            this.addVolume(0.05);
            this.triggerDropAnim();
        }, 150);
    },

    stopFlow() {
        if(this.animationInterval) clearInterval(this.animationInterval);
        this.animationInterval = null;
    },

    addDrop() { this.addVolume(0.05); this.triggerDropAnim(); },
    addStream() { this.addVolume(1.00); this.triggerDropAnim(); },

    triggerDropAnim() {
        const drop = document.getElementById('dropElement');
        drop.style.backgroundColor = 'rgba(2, 132, 199, 0.7)';
        drop.classList.remove('falling');
        void drop.offsetWidth;
        drop.classList.add('falling');
    },

    addVolume(amount) {
        if(this.volSpent + amount >= this.buretteCapacity) {
            alert("A bureta está vazia! Capacidade máxima atingida.");
            this.stopFlow();
            return;
        }
        this.volSpent += amount;
        this.updateVisuals();
        this.drawGraph();
    },

    calculateCurrentPH() {
        const nFlask = this.cFlask * this.sampleVol;
        const nBurette = this.cBurette * this.volSpent;
        const totalV = this.sampleVol + this.volSpent;

        if (nBurette < nFlask) {
            const excessH = (nFlask - nBurette) / totalV;
            return Math.max(0, Math.min(14, -Math.log10(excessH)));
        } else if (Math.abs(nBurette - nFlask) < 1e-5) {
            return 7.00;
        } else {
            const excessOH = (nBurette - nFlask) / totalV;
            const pOH = -Math.log10(excessOH);
            return Math.max(0, Math.min(14, 14.00 - pOH));
        }
    },

    updateVisuals() {
        const currentPH = this.calculateCurrentPH();
        document.getElementById('volSpentDisplay').innerText = `${this.volSpent.toFixed(2)} mL`;
        const remaining = Math.max(0, this.buretteCapacity - this.volSpent);
        document.getElementById('volRemainingDisplay').innerText = `${remaining.toFixed(2)} mL`;
        document.getElementById('pHDisplay').innerText = `${currentPH.toFixed(2)}`;

        const liquidBurette = document.getElementById('buretteLiquid');
        const liquidErlen = document.getElementById('erlenmeyerLiquid');

        const buretteHeightPct = (remaining / this.buretteCapacity) * 100;
        liquidBurette.style.height = `${buretteHeightPct}%`;

        const totalErlenVol = this.sampleVol + this.volSpent;
        liquidErlen.style.height = `${Math.min(85, 40 + (totalErlenVol / 75) * 45)}%`;

        // 4. FENOLFTALEÍNA COM TRANSIÇÃO GRADUAL DE PH (8.2 a 10.0)
        let colorHex = "transparent";
        let statusText = "Incolor (Meio Ácido)";

        if (this.indicator === 'phenolphthalein') {
            if (currentPH < 8.2) {
                colorHex = "transparent";
                statusText = "Incolor (Abaixo da viragem)";
            } else if (currentPH >= 8.2 && currentPH <= 10.0) {
                // Transição gradual com base no pH
                const ratio = (currentPH - 8.2) / (10.0 - 8.2);
                const alpha = Math.min(0.8, 0.1 + ratio * 0.7);
                colorHex = `rgba(236, 72, 153, ${alpha})`;
                statusText = ratio < 0.3 ? "Início da Viragem (Rosa muito claro)" : "Ponto Final (Rosa Persistente)";
            } else {
                colorHex = "rgba(236, 72, 153, 0.9)";
                statusText = "Rosa Intenso (Excesso de Base)";
            }
        } else {
            // Alaranjado de Metila
            if (currentPH < 3.1) { colorHex = "rgba(239, 68, 68, 0.6)"; statusText = "Vermelho"; }
            else if (currentPH >= 3.1 && currentPH <= 4.4) { colorHex = "rgba(245, 158, 11, 0.6)"; statusText = "Laranja (Viragem)"; }
            else { colorHex = "rgba(234, 179, 8, 0.6)"; statusText = "Amarelo"; }
        }

        liquidErlen.style.backgroundColor = colorHex;
        document.getElementById('statusDisplay').innerText = statusText;
    },

    drawGraph() {
        const canvas = document.getElementById('titrationCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const padding = 40;
        const graphWidth = width - 2 * padding;
        const graphHeight = height - 2 * padding;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        const scaleX = (val) => padding + (val / this.buretteCapacity) * graphWidth;
        const scaleY = (val) => height - padding - (val / 14.0) * graphHeight;

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let isFirst = true;
        for (let v = 0; v <= this.buretteCapacity; v += 0.5) {
            const oldVol = this.volSpent;
            this.volSpent = v;
            const phVal = this.calculateCurrentPH();
            this.volSpent = oldVol;
            const px = scaleX(v);
            const py = scaleY(phVal);
            if(isFirst) { ctx.moveTo(px, py); isFirst = false; } else { ctx.lineTo(px, py); }
        }
        ctx.stroke();

        const currX = scaleX(this.volSpent);
        const currY = scaleY(this.calculateCurrentPH());
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(currX, currY, 6, 0, 2 * Math.PI);
        ctx.fill();
    },

    resetFlask() {
        this.stopFlow();
        this.volSpent = 0.0;
        this.updateVisuals();
        this.drawGraph();
    }
};

// 5. MINIJOGOS REAIS COMPLETOS
const MiniGamePH = {
    samples: [
        { name: 'Amostra 1', realPH: 2.1, type: 'Ácido' },
        { name: 'Amostra 2', realPH: 7.0, type: 'Neutro' },
        { name: 'Amostra 3', realPH: 12.4, type: 'Básico' }
    ],
    currentIndex: 0,
    score: 0,

    init() {
        this.currentIndex = 0;
        this.score = 0;
        App.goToScreen('screen-minigame');
        document.getElementById('mgTitle').innerText = "Minijogo 1 — Detetive do pH";
        this.render();
    },

    render() {
        if(this.currentIndex >= this.samples.length) {
            document.getElementById('mgContainer').innerHTML = `
                <div class="alert-box">
                    <h3>Fim do Minijogo!</h3>
                    <p>Você acertou todas as classificações de pH.</p>
                    <p>Pontuação Total: <strong>${this.score} pts</strong></p>
                </div>
                <button class="btn" onclick="MiniGamePH.init()">Jogar Novamente</button>
            `;
            App.addScore(this.score);
            return;
        }

        const sample = this.samples[this.currentIndex];
        document.getElementById('mgContainer').innerHTML = `
            <p>Analise a <strong>${sample.name}</strong> utilizando os testes disponíveis:</p>
            <button class="btn btn-secondary" onclick="MiniGamePH.testSample('acid')">Testar com Papel Indicador</button>
            <div id="phTestResult" class="mt-4"></div>
            <div class="control-group mt-4" id="guessGroup" style="display:none;">
                <label>Classifique o caráter da solução:</label>
                <select id="userPHGuess">
                    <option value="Ácido">Ácido</option>
                    <option value="Neutro">Neutro</option>
                    <option value="Básico">Básico</option>
                </select>
                <button class="btn mt-4" onclick="MiniGamePH.submitGuess()">Enviar Resposta</button>
            </div>
            <div id="phFeedback" class="mt-4"></div>
        `;
    },

    testSample(type) {
        const sample = this.samples[this.currentIndex];
        document.getElementById('phTestResult').innerHTML = `<strong>Leitura do medidor:</strong> pH = ${sample.realPH.toFixed(1)}`;
        document.getElementById('guessGroup').style.display = 'flex';
    },

    submitGuess() {
        const guess = document.getElementById('userPHGuess').value;
        const sample = this.samples[this.currentIndex];
        const fb = document.getElementById('phFeedback');

        if(guess === sample.type) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Correto!</strong>`;
            this.score += 25;
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> Era ${sample.type}.`;
        }
        this.currentIndex++;
        setTimeout(() => this.render(), 1800);
    }
};

const MiniGameTitrationChallenge = {
    init() {
        App.goToScreen('screen-minigame');
        document.getElementById('mgTitle').innerText = "Minijogo 2 — Desafio da Titulação";
        document.getElementById('mgContainer').innerHTML = `
            <p>Missão: Titular uma solução desconhecida de HCl com NaOH 0,1000 mol/L gastando exatamente 25,00 mL.</p>
            <div class="control-group">
                <label>Insira o volume gasto medido (mL):</label>
                <input type="number" id="chVolInput" step="0.01" value="25.00">
            </div>
            <button class="btn mt-4" onclick="MiniGameTitrationChallenge.check()">Concluir Desafio</button>
            <div id="chFeedback" class="mt-4"></div>
        `;
    },
    check() {
        const val = parseFloat(document.getElementById('chVolInput').value);
        const fb = document.getElementById('chFeedback');
        if(Math.abs(val - 25.00) <= 0.1) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Excelente precisão!</strong> Você executou a titulação sem desperdício de titulante.`;
            App.addScore(50);
        } else {
            fb.innerHTML = `<strong style="color:var(--warning)">Atenção:</strong> O volume dispensado desviou do ponto ideal, gerando erro analítico.`;
        }
    }
};

const MiniGameSolutionPrep = {
    init() {
        App.goToScreen('screen-minigame');
        document.getElementById('mgTitle').innerText = "Minijogo 3 — Preparação de Soluções";
        document.getElementById('mgContainer').innerHTML = `
            <p>Prepare <strong>250 mL</strong> de $\text{NaOH}$ a <strong>0,1000 mol/L</strong> (Massa Molar = 40,00 g/mol).</p>
            <div class="control-group">
                <label>Qual a massa necessária (g)?</label>
                <input type="number" id="prepMassInput" step="0.01" placeholder="Ex: 1.00">
            </div>
            <button class="btn mt-4" onclick="MiniGameSolutionPrep.check()">Verificar Preparo</button>
            <div id="prepFb" class="mt-4"></div>
        `;
    },
    check() {
        const m = parseFloat(document.getElementById('prepMassInput').value);
        // m = C * V * Mm = 0.10 * 0.250 * 40.00 = 1.00 g
        const fb = document.getElementById('prepFb');
        if(Math.abs(m - 1.00) <= 0.05) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Correto!</strong> $m = 0,10 \\times 0,250 \\times 40,00 = 1,00\\text{ g}$. Solução aferida com sucesso.`;
            App.addScore(30);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> Reveja o cálculo: $m = C \\times V \\times Mm$.`;
        }
    }
};

const MiniGameLabError = {
    init() {
        App.goToScreen('screen-minigame');
        document.getElementById('mgTitle').innerText = "Minijogo 4 — Identifique o Erro do Laboratório";
        document.getElementById('mgContainer').innerHTML = `
            <p><strong>Cenário:</strong> O analista tarou o béquer na balança analítica, adicionou o soluto sólido e anotou a massa exibida. No entanto, esqueceu de verificar se havia correntes de ar e se a leitura estava estabilizada.</p>
            <div class="control-group">
                <label>Qual é a consequência principal?</label>
                <select id="errSelect">
                    <option value="none">Nenhum impacto</option>
                    <option value="fluctuation">Erro de flutuação e imprecisão na pesagem analítica</option>
                    <option value="volume">Alteração do volume do balão volumétrico</option>
                </select>
            </div>
            <button class="btn mt-4" onclick="MiniGameLabError.check()">Responder</button>
            <div id="errFb" class="mt-4"></div>
        `;
    },
    check() {
        const val = document.getElementById('errSelect').value;
        const fb = document.getElementById('errFb');
        if(val === 'fluctuation') {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Resposta Correta!</strong> Correntes de ar causam instabilidade no prato da balança de 4 casas decimais.`;
            App.addScore(30);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> A câmara de proteção serve exatamente para evitar correntes de ar na pesagem.`;
        }
    }
};

const MiniGameStandardization = {
    init() {
        App.goToScreen('screen-minigame');
        document.getElementById('mgTitle').innerText = "Minijogo 5 — Padronização de Titulantes";
        document.getElementById('mgContainer').innerHTML = `
            <p>Padronização de $\text{NaOH}$ com KHP (1:1). Massa de KHP pesada: <strong>0,5105 g</strong> (MM = 204,22 g/mol). Volume gasto de $\text{NaOH}$: <strong>25,00 mL</strong>.</p>
            <div class="control-group">
                <label>Qual a concentração real do $\text{NaOH}$ (mol/L)?</label>
                <input type="number" id="stdInput" step="0.0001" placeholder="Ex: 0.1000">
            </div>
            <button class="btn mt-4" onclick="MiniGameStandardization.check()">Conferir</button>
            <div id="stdFb" class="mt-4"></div>
        `;
    },
    check() {
        const val = parseFloat(document.getElementById('stdInput').value);
        const correct = (0.5105 / 204.22) / (25.00 / 1000.0); // ~0.1000 mol/L
        const fb = document.getElementById('stdFb');
        if(Math.abs(val - correct) <= 0.001) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Parabéns!</strong> Concentração padronizada com sucesso: <strong>${correct.toFixed(4)} mol/L</strong>.`;
            App.addScore(40);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> $C = \\frac{m / Mm}{V}$. Tente novamente!`;
        }
    }
};
