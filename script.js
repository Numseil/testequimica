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

    goToHome() {
        this.goToScreen('screen-home');
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

// BALANÇA ANALÍTICA
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
        alert("Balança tarada com sucesso!");
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
        this.tareValue = 0.0000;
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
        if(this.solidMass <= 0) return;
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

// PREPARO DE SOLUÇÃO
const PrimaryStandardLab = {
    init() {
        App.goToScreen('screen-prep-standard');
        this.updateInfo();
        document.getElementById('prepTargetConc').addEventListener('input', () => this.updateInfo());
    },
    getMolarMass(type) { return type === 'KHP' ? 204.22 : 105.99; },
    getPureza(type) { return type === 'KHP' ? 0.999 : 0.998; },
    updateInfo() {
        const type = document.getElementById('prepStandardType').value;
        const C = parseFloat(document.getElementById('prepTargetConc').value) || 0.1;
        const V_mL = parseFloat(document.getElementById('prepVolumeBallon').value) || 250;
        const Mm = this.getMolarMass(type);
        const purity = this.getPureza(type);
        const mass = (C * (V_mL / 1000.0) * Mm) / purity;
        document.getElementById('spanTheoreticalMass').innerText = mass.toFixed(4);
    },
    executePreparation() {
        alert("Solução preparada e aferida no balão volumétrico com sucesso!");
        App.addScore(30);
    }
};

// MOTOR QUÍMICO RIGOROSO E VALIDAÇÃO DE TITULAÇÕES
const TitrationLab = {
    flaskSol: 'HCl',
    flaskConcType: 'unknown',
    flaskConcTrue: 0.1000,
    sampleVol: 25.00,
    buretteSol: 'NaOH',
    buretteConc: 0.1000,
    indicator: 'phenolphthalein',
    buretteCapacity: 50.0,
    
    buretteCurrent: 0.0,
    volSpent: 0.0,
    isStopcockOpen: false,
    animationInterval: null,
    reactionType: 'strong_acid_strong_base',
    stoichiometryRatio: 1, // mols de titulante por mol de amostra

    openConfig() {
        App.goToScreen('screen-titration-config');
        this.toggleConcInputs();
    },

    toggleConcInputs() {
        const type = document.getElementById('cfgFlaskConcType').value;
        const group = document.getElementById('groupFlaskConcVal');
        group.style.display = type === 'known' ? 'flex' : 'none';
    },

    validateCombination(flask, burette) {
        // Classificar reagentes
        const acids = ['HCl', 'CH3COOH', 'H2SO4'];
        const bases = ['NaOH'];

        const isFlaskAcid = acids.includes(flask);
        const isFlaskBase = bases.includes(flask);
        const isBuretteAcid = acids.includes(burette);
        const isBuretteBase = bases.includes(burette);

        if (isFlaskAcid && isBuretteAcid) {
            return { valid: false, msg: `Combinação Inválida: ${flask} (ácido) na amostra com ${burette} (ácido) na bureta não corresponde a uma reação de neutralização ácido-base.` };
        }
        if (isFlaskBase && isBuretteBase) {
            return { valid: false, msg: `Combinação Inválida: ${flask} (base) na amostra com ${burette} (base) na bureta não gera neutralização válida.` };
        }
        if (isFlaskAcid && isBuretteBase) {
            return { valid: true, type: 'acid_titrated_by_base' };
        }
        if (isFlaskBase && isBuretteAcid) {
            return { valid: true, type: 'base_titrated_by_acid' };
        }
        return { valid: false, msg: "Combinação não suportada pelo motor analítico." };
    },

    startFromConfig() {
        const flask = document.getElementById('cfgFlaskSolution').value;
        const burette = document.getElementById('cfgBuretteSolution').value;
        const concType = document.getElementById('cfgFlaskConcType').value;
        
        const validation = this.validateCombination(flask, burette);
        const errBox = document.getElementById('configErrorBox');

        if(!validation.valid) {
            errBox.innerHTML = `<div class="alert-box" style="border-left-color: var(--danger); background: #fef2f2;"><strong>Erro Químico:</strong> ${validation.msg}</div>`;
            return;
        }
        errBox.innerHTML = "";

        this.flaskSol = flask;
        this.buretteSol = burette;
        this.flaskConcType = concType;
        this.sampleVol = parseFloat(document.getElementById('cfgSampleVol').value) || 25.00;
        this.buretteConc = parseFloat(document.getElementById('cfgBuretteConc').value) || 0.1000;
        this.indicator = document.getElementById('cfgIndicator').value;
        this.buretteCapacity = parseFloat(document.getElementById('cfgBuretteCapacity').value) || 50.0;

        // Definir valor verdadeiro (oculto se desconhecido)
        if (concType === 'known') {
            this.flaskConcTrue = parseFloat(document.getElementById('cfgFlaskConc').value) || 0.1000;
        } else {
            // Gerar valor aleatório reproduzível ou dinâmico
            this.flaskConcTrue = parseFloat((0.0800 + Math.random() * 0.0600).toFixed(4));
        }

        // Definir estequiometria
        if (flask === 'H2SO4') {
            this.stoichiometryRatio = 2; // H2SO4 + 2 NaOH -> Na2SO4 + 2 H2O (2 mols de NaOH por mol de H2SO4)
            this.reactionType = 'polyprotic_acid_base';
        } else if (flask === 'CH3COOH') {
            this.stoichiometryRatio = 1;
            this.reactionType = 'weak_acid_strong_base';
        } else {
            this.stoichiometryRatio = 1;
            this.reactionType = validation.type;
        }

        this.buretteCurrent = 0.0;
        this.volSpent = 0.0;

        document.getElementById('volRemainingDisplay').innerText = `${this.buretteCapacity.toFixed(2)} mL`;
        document.getElementById('displayReactionName').innerText = `${flask} vs ${burette} (${validation.type})`;

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
            alert("A bureta está vazia!");
            this.stopFlow();
            return;
        }
        this.volSpent += amount;
        this.updateVisuals();
        this.drawGraph();
    },

    calculateCurrentPH(vBurette = this.volSpent) {
        const nFlask = this.flaskConcTrue * this.sampleVol; // milimols
        const nBurette = this.buretteConc * vBurette; // milimols
        const totalV = this.sampleVol + vBurette;

        // Estequiometria ajustada pelo coeficiente
        const effectiveBuretteMoles = nBurette / this.stoichiometryRatio;

        if (this.reactionType === 'acid_titrated_by_base' || this.reactionType === 'polyprotic_acid_base' || this.reactionType === 'weak_acid_strong_base') {
            if (effectiveBuretteMoles < nFlask) {
                // Antes do ponto de equivalência (excesso de ácido)
                const excessH = (nFlask - effectiveBuretteMoles) / totalV;
                if (this.reactionType === 'weak_acid_strong_base') {
                    // Tampão simples / ácido fraco
                    return Math.max(1.5, Math.min(6.5, 4.76 - Math.log10((nFlask - effectiveBuretteMoles) / effectiveBuretteMoles)));
                }
                return Math.max(0, Math.min(14, -Math.log10(excessH)));
            } else if (Math.abs(effectiveBuretteMoles - nFlask) < 1e-4) {
                // Ponto de equivalência
                if (this.flaskSol === 'CH3COOH') return 8.72; // Hidrólise básica do acetato
                return 7.00;
            } else {
                // Após o ponto de equivalência (excesso de base forte na bureta)
                const excessOH = (effectiveBuretteMoles - nFlask) / totalV;
                const pOH = -Math.log10(excessOH);
                return Math.max(0, Math.min(14, 14.00 - pOH));
            }
        } else if (this.reactionType === 'base_titrated_by_acid') {
            // Base forte titulada por ácido forte (pH decrescente)
            if (effectiveBuretteMoles < nFlask) {
                const excessOH = (nFlask - effectiveBuretteMoles) / totalV;
                const pOH = -Math.log10(excessOH);
                return Math.max(0, Math.min(14, 14.00 - pOH));
            } else if (Math.abs(effectiveBuretteMoles - nFlask) < 1e-4) {
                return 7.00;
            } else {
                const excessH = (effectiveBuretteMoles - nFlask) / totalV;
                return Math.max(0, Math.min(14, -Math.log10(excessH)));
            }
        }
        return 7.00;
    },

    updateVisuals() {
        const currentPH = this.calculateCurrentPH();
        document.getElementById('volSpentDisplay').innerText = `${this.volSpent.toFixed(2)} mL`;
        const remaining = Math.max(0, this.buretteCapacity - this.volSpent);
        document.getElementById('volRemainingDisplay').innerText = `${remaining.toFixed(2)} mL`;
        document.getElementById('pHDisplay').innerText = `${currentPH.toFixed(2)}`;

        const liquidBurette = document.getElementById('buretteLiquid');
        const liquidErlen = document.getElementById('erlenmeyerLiquid');

        liquidBurette.style.height = `${(remaining / this.buretteCapacity) * 100}%`;
        const totalErlenVol = this.sampleVol + this.volSpent;
        liquidErlen.style.height = `${Math.min(85, 40 + (totalErlenVol / 75) * 45)}%`;

        // Indicador com transição gradual rigorosa de pH
        let colorHex = "transparent";
        let statusText = "Incolor";

        if (this.indicator === 'phenolphthalein') {
            if (currentPH < 8.2) {
                colorHex = "transparent";
                statusText = "Incolor (Abaixo da viragem)";
            } else if (currentPH >= 8.2 && currentPH <= 10.0) {
                const ratio = (currentPH - 8.2) / (10.0 - 8.2);
                const alpha = Math.min(0.85, 0.15 + ratio * 0.7);
                colorHex = `rgba(236, 72, 153, ${alpha})`;
                statusText = ratio < 0.3 ? "Início da Viragem (Rosa pálido)" : "Ponto Final (Rosa Persistente)";
            } else {
                colorHex = "rgba(236, 72, 153, 0.9)";
                statusText = "Rosa Intenso (Excesso)";
            }
        } else {
            // Alaranjado de Metila (pH 3.1 - 4.4)
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
            const phVal = this.calculateCurrentPH(v);
            const px = scaleX(v);
            const py = scaleY(phVal);
            if(isFirst) { ctx.moveTo(px, py); isFirst = false; } else { ctx.lineTo(px, py); }
        }
        ctx.stroke();

        const currX = scaleX(this.volSpent);
        const currY = scaleY(this.calculateCurrentPH(this.volSpent));
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
    },

    openResultModal() {
        this.stopFlow();
        document.getElementById('resVolSpent').innerText = `${this.volSpent.toFixed(2)} mL`;
        App.goToScreen('screen-titration-result');
    },

    checkUserResult() {
        const userVal = parseFloat(document.getElementById('resUserConc').value);
        const feedback = document.getElementById('resFeedback');

        if(isNaN(userVal)) {
            feedback.innerHTML = `<span style="color:var(--danger)">Insira um valor numérico válido.</span>`;
            return;
        }

        // Cálculo exato pelo motor estequiométrico invertido
        // n_amostra = (n_titulante / stoichiometryRatio) => C_amostra * V_amostra = (C_titulante * V_gasto) / stoichiometryRatio
        const exactConc = (this.buretteConc * this.volSpent) / (this.stoichiometryRatio * this.sampleVol);
        const errorPct = Math.abs((userVal - exactConc) / exactConc) * 100;

        if(errorPct <= 3.5) {
            feedback.innerHTML = `<strong style="color:var(--emerald-dark)">Parabéns! Excelente precisão analítica.</strong><br>` +
                `Concentração verdadeira da amostra: <strong>${exactConc.toFixed(4)} mol/L</strong>. Desvio de apenas ${errorPct.toFixed(1)}%.`;
            App.addScore(50);
        } else {
            feedback.innerHTML = `<strong style="color:var(--warning)">Atenção:</strong> O valor calculado difere do esperado.<br>` +
                `Valor verdadeiro da simulação: <strong>${exactConc.toFixed(4)} mol/L</strong>. Revise a estequiometria ($${this.stoichiometryRatio}:1$) e o volume gasto.`;
        }
    }
};

// CENTRAL DO DESAFIO DIÁRIO (BASEADO NA DATA ATUAL E REPRODUZÍVEL)
const DailyChallenge = {
    getTodaySeed() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    initHub() {
        App.goToScreen('screen-daily-hub');
        const seed = this.getTodaySeed();
        document.getElementById('dailyHubSubtitle').innerText = `Desafios ativos para a data de hoje: ${seed} (Fuso Local)`;

        const challenges = [
            { id: 1, title: '1. Concentração Desconhecida de HCl', desc: 'Determine a molaridade de 25 mL de HCl titulada com NaOH 0,1000 mol/L.', type: 'unknown_conc' },
            { id: 2, title: '2. Padronização de NaOH', desc: 'Padronize NaOH usando 0,5105 g de KHP (Proporção 1:1).', type: 'std_naoh' },
            { id: 3, title: '3. Padronização de HCl', desc: 'Padronize HCl usando 0,5300 g de Na₂CO₃ anidro (Proporção 1:2).', type: 'std_hcl' },
            { id: 4, title: '4. Seleção de Indicador', desc: 'Identifique o indicador adequado para titulação de ácido fraco.', type: 'indicator_choice' },
            { id: 5, title: '5. Combinação Inválida de Reagentes', desc: 'Identifique por que HCl + HCl bloqueia a titulação.', type: 'invalid_combo' },
            { id: 6, title: '6. Titulação de Ácido Acético', desc: 'Determine a concentração de CH₃COOH titulado por NaOH.', type: 'weak_acid' },
            { id: 7, title: '7. Desafio de Precisão Experimental', desc: 'Execute a titulação de H₂SO₄ diprótico com NaOH.', type: 'polyprotic' }
        ];

        const grid = document.getElementById('dailyChallengesGrid');
        grid.innerHTML = "";
        challenges.forEach(ch => {
            grid.innerHTML += `
                <div class="card-menu" onclick="DailyChallenge.startChallenge(${ch.id})">
                    <h3>${ch.title}</h3>
                    <p>${ch.desc}</p>
                    <span style="font-size: 0.8rem; color: var(--emerald-dark); font-weight: bold;">Status: Disponível hoje</span>
                </div>
            `;
        });
    },

    startChallenge(id) {
        App.goToScreen('screen-challenge-run');
        const titleMap = {
            1: 'Desafio 1: Concentração Desconhecida de HCl',
            2: 'Desafio 2: Padronização de NaOH com KHP',
            3: 'Desafio 3: Padronização de HCl com Na₂CO₃',
            4: 'Desafio 4: Seleção de Indicador',
            5: 'Desafio 5: Validação de Reagentes',
            6: 'Desafio 6: Ácido Acético vs NaOH',
            7: 'Desafio 7: Titulação de H₂SO₄ Diprótico'
        };

        document.getElementById('chRunTitle').innerText = titleMap[id] || 'Desafio Diário';
        document.getElementById('chRunInstructions').innerHTML = `Instruções: Resolva o problema analítico com base nos parâmetros fornecidos abaixo. A data de referência é ${this.getTodaySeed()}.`;
        
        let paramHtml = "";
        if (id === 1) {
            paramHtml = `<p>Volume da amostra de HCl: <strong>25,00 mL</strong><br>Volume gasto de NaOH 0,1000 mol/L no ponto final: <strong>24,80 mL</strong></p>`;
            window.activeChallengeExpected = (0.1000 * 24.80) / 25.00;
        } else if (id === 2) {
            paramHtml = `<p>Massa de KHP pesada: <strong>0,5105 g</strong> (MM = 204,22 g/mol)<br>Volume gasto de NaOH: <strong>25,00 mL</strong></p>`;
            window.activeChallengeExpected = (0.5105 / 204.22) / (25.00 / 1000.0);
        } else if (id === 3) {
            paramHtml = `<p>Massa de Na₂CO₃ anidro: <strong>0,5300 g</strong> (MM = 105,99 g/mol)<br>Volume gasto de HCl: <strong>25,00 mL</strong><br><em>Estequiometria 1:2</em></p>`;
            window.activeChallengeExpected = (2 * (0.5300 / 105.99)) / (25.00 / 1000.0);
        } else {
            paramHtml = `<p>Parâmetros analíticos padrão do desafio diário.</p>`;
            window.activeChallengeExpected = 0.1000;
        }

        document.getElementById('chRunParameters').innerHTML = paramHtml;
        document.getElementById('chUserAnswer').value = "";
        document.getElementById('chRunFeedback').innerHTML = "";
    },

    submitAnswer() {
        const val = parseFloat(document.getElementById('chUserAnswer').value);
        const fb = document.getElementById('chRunFeedback');
        const expected = window.activeChallengeExpected || 0.1000;

        if (isNaN(val)) {
            fb.innerHTML = `<span style="color:var(--danger)">Insira um valor numérico.</span>`;
            return;
        }

        const error = Math.abs((val - expected) / expected) * 100;
        if (error <= 3.0) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Desafio Concluído com Sucesso!</strong><br>` +
                `O resultado calculado (${val.fourDecimals ? val.toFixed(4) : val}) está correto. O valor esperado era ${expected.toFixed(4)}.<br>` +
                `<em>Explicação Química:</em> A estequiometria e os equivalentes molares foram aplicados corretamente.`;
            App.addScore(40);
        } else {
            fb.innerHTML = `<strong style="color:var(--warning)">Resultado Incorreto.</strong> O valor esperado era ${expected.toFixed(4)}. Reveja o cálculo estequiométrico.`;
        }
    },

    startRandomTraining() {
        alert("Modo de Treinamento Aleatório ativado! Redirecionando para a Bancada de Titulação Livre.");
        TitrationLab.openConfig();
    }
};
