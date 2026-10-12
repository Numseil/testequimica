// Sistema Principal de Controle do App com persistência em localStorage
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
        document.getElementById(screenId).classList.add('active');
    },

    addScore(points) {
        this.score += points;
        localStorage.setItem('labquimica_score', this.score);
        this.updateLevelDisplay();
    },

    updateLevelDisplay() {
        document.getElementById('userScore').innerText = this.score;
        if(this.score >= 100 && this.score < 250) {
            this.level = "Analista Iniciante";
        } else if(this.score >= 250 && this.score < 500) {
            this.level = "Analista Químico";
        } else if(this.score >= 500) {
            this.level = "Especialista em Análises";
        }
        document.getElementById('userLevel').innerText = this.level;
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
            alert("Atenção! Faltam EPIs obrigatórios (Jaleco, Óculos ou Sapatos fechados). A segurança no laboratório é prioritária.");
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Módulo de Simulação de Titulação Ácido-Base Avançada
const TitrationLab = {
    flaskSol: 'HCl',
    buretteSol: 'NaOH',
    concMode: 'unknown_titrand',
    knownConc: 0.1000,
    unknownConc: 0.1000,
    sampleVol: 25.00,
    indicator: 'phenolphthalein',

    buretteTotal: 50.00,
    buretteCurrent: 0.00,
    volSpent: 0.00,
    isStopcockOpen: false,
    animationInterval: null,
    trials: [],
    currentTrialIndex: 1,
    exactEquivVolume: 25.00,

    openConfig() {
        App.goToScreen('screen-titration-config');
        document.getElementById('cfgSampleVol').addEventListener('change', (e) => {
            document.getElementById('groupCustomVol').style.display = (e.target.value === 'custom') ? 'flex' : 'none';
        });
    },

    toggleConfigMode() {
        const mode = document.getElementById('cfgConcMode').value;
        const group = document.getElementById('groupKnownConc');
        const label = document.getElementById('labelKnownConc');
        if(mode === 'training') {
            label.innerText = "Concentração de Ambas as Soluções (Conhecidas):";
            group.style.display = 'flex';
        } else if(mode === 'unknown_titrand') {
            label.innerText = "Concentração Conhecida da Bureta (mol/L):";
            group.style.display = 'flex';
        } else {
            label.innerText = "Concentração Conhecida do Erlenmeyer (mol/L):";
            group.style.display = 'flex';
        }
    },

    startFromConfig() {
        this.flaskSol = document.getElementById('cfgFlaskSolution').value;
        this.buretteSol = document.getElementById('cfgBuretteSolution').value;

        // Validação química: 1 ácido e 1 base
        const acids = ['HCl', 'CH3COOH'];
        const bases = ['NaOH', 'KOH'];
        const isFlaskAcid = acids.includes(this.flaskSol);
        const isBuretteAcid = acids.includes(this.buretteSol);

        if (isFlaskAcid === isBuretteAcid) {
            alert("Combinação inválida! O experimento de titulação exige um ácido em um recipiente e uma base no outro.");
            return;
        }

        this.concMode = document.getElementById('cfgConcMode').value;
        const knownVal = parseFloat(document.getElementById('cfgKnownConcVal').value);

        const volChoice = document.getElementById('cfgSampleVol').value;
        if(volChoice === 'custom') {
            this.sampleVol = parseFloat(document.getElementById('cfgCustomVolVal').value) || 25.00;
        } else {
            this.sampleVol = parseFloat(volChoice);
        }

        this.indicator = document.getElementById('cfgIndicator').value;

        // Atribuir concentrações
        if(this.concMode === 'training') {
            this.knownConc = knownVal;
            this.unknownConc = knownVal; // Ambas conhecidas
        } else if(this.concMode === 'unknown_titrand') {
            this.knownConc = knownVal; // bureta
            this.unknownConc = parseFloat((0.080 + Math.random() * 0.040).toFixed(4)); // erlenmeyer desconhecido
        } else {
            this.knownConc = knownVal; // erlenmeyer
            this.unknownConc = parseFloat((0.080 + Math.random() * 0.040).toFixed(4)); // bureta desconhecida
        }

        // Calcular volume de equivalência exato
        // n_acid = n_base => C_flask * V_flask = C_burette * V_burette
        const cFlask = (this.concMode === 'unknown_titrand') ? this.unknownConc : this.knownConc;
        const cBurette = (this.concMode === 'unknown_titrant') ? this.unknownConc : this.knownConc;
        this.exactEquivVolume = (cFlask * this.sampleVol) / cBurette;

        this.buretteCurrent = parseFloat((Math.random() * 5).toFixed(2));
        this.volSpent = 0.00;
        this.currentTrialIndex = this.trials.length + 1;

        if(this.currentTrialIndex > 3) {
            this.trials = [];
            this.currentTrialIndex = 1;
        }

        document.getElementById('trialNumber').innerText = `${this.currentTrialIndex} de 3`;
        document.getElementById('volInitialDisplay').innerText = `${this.buretteCurrent.toFixed(2)} mL`;
        document.getElementById('titrationObjective').innerText = `Titulação: ${this.flaskSol} (${this.sampleVol} mL) com ${this.buretteSol}`;
        document.getElementById('calcSection').classList.add('hidden');
        document.getElementById('calcSection').style.display = 'none';
        document.getElementById('btnFinishTrial').disabled = true;

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
            this.addVolume(0.10);
            this.triggerDropAnim();
        }, 150);
    },

    stopFlow() {
        if(this.animationInterval) clearInterval(this.animationInterval);
        this.animationInterval = null;
    },

    addDrop() {
        this.addVolume(0.05);
        this.triggerDropAnim();
    },

    addSmall() {
        this.addVolume(0.10);
        this.triggerDropAnim();
    },

    addStream() {
        this.addVolume(1.00);
        this.triggerDropAnim();
    },

    triggerDropAnim() {
        const drop = document.getElementById('dropElement');
        drop.style.backgroundColor = this.getBuretteLiquidColor();
        drop.classList.remove('falling');
        void drop.offsetWidth;
        drop.classList.add('falling');
    },

    addVolume(amount) {
        if(this.buretteCurrent + this.volSpent + amount >= this.buretteTotal) {
            alert("Bureta vazia!");
            this.stopFlow();
            return;
        }
        this.volSpent += amount;
        this.updateVisuals();
        this.drawGraph();
    },

    getBuretteLiquidColor() {
        return 'rgba(2, 132, 199, 0.7)';
    },

    calculateCurrentPH() {
        const acids = ['HCl', 'CH3COOH'];
        const isFlaskAcid = acids.includes(this.flaskSol);
        
        const cFlask = (this.concMode === 'unknown_titrand') ? this.unknownConc : this.knownConc;
        const cBurette = (this.concMode === 'unknown_titrant') ? this.unknownConc : this.knownConc;

        const nFlask = cFlask * this.sampleVol; // mmol
        const nBurette = cBurette * this.volSpent; // mmol
        const totalV = this.sampleVol + this.volSpent; // mL

        if (isFlaskAcid) {
            // Titrando Ácido com Base (NaOH ou KOH)
            const isWeakAcid = (this.flaskSol === 'CH3COOH');
            const Ka = 1.8e-5;

            if (!isWeakAcid) {
                // Ácido Forte + Base Forte
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
            } else {
                // Ácido Fraco (CH3COOH) + Base Forte
                if (this.volSpent === 0) {
                    // [H+] = sqrt(Ka * Ca)
                    const h = Math.sqrt(Ka * cFlask);
                    return Math.max(0, Math.min(14, -Math.log10(h)));
                } else if (nBurette < nFlask) {
                    // Região de Tampão (Henderson-Hasselbalch)
                    const pKa = -Math.log10(Ka);
                    const nA = nFlask - nBurette; // mols ácido não reagido
                    const nSalt = nBurette; // mols sal formado
                    const pH = pKa + Math.log10(nSalt / nA);
                    return Math.max(0, Math.min(14, pH));
                } else if (Math.abs(nBurette - nFlask) < 1e-5) {
                    // Ponto de equivalência (Hidrólise do acetato)
                    const cSalt = nFlask / totalV;
                    const Kw = 1.0e-14;
                    const Kb = Kw / Ka;
                    const oh = Math.sqrt(Kb * cSalt);
                    const pOH = -Math.log10(oh);
                    return Math.max(0, Math.min(14, 14.00 - pOH));
                } else {
                    // Excesso de base forte
                    const excessOH = (nBurette - nFlask) / totalV;
                    const pOH = -Math.log10(excessOH);
                    return Math.max(0, Math.min(14, 14.00 - pOH));
                }
            }
        } else {
            // Titrando Base (NaOH ou KOH) com Ácido (HCl)
            if (nBurette < nFlask) {
                const excessOH = (nFlask - nBurette) / totalV;
                const pOH = -Math.log10(excessOH);
                return Math.max(0, Math.min(14, 14.00 - pOH));
            } else if (Math.abs(nBurette - nFlask) < 1e-5) {
                return 7.00;
            } else {
                const excessH = (nBurette - nFlask) / totalV;
                return Math.max(0, Math.min(14, -Math.log10(excessH)));
            }
        }
    },

    getIndicatorStyle(pH) {
        const acids = ['HCl', 'CH3COOH'];
        const isFlaskAcid = acids.includes(this.flaskSol);

        if (this.indicator === 'phenolphthalein') {
            if (isFlaskAcid) {
                // Ácido titulado com base: incolor até pH 8.2, depois rosa progressivo
                if (pH < 8.2) return { color: 'transparent', text: 'Incolor (Meio Ácido)' };
                if (pH >= 8.2 && pH <= 9.8) {
                    const alpha = Math.min(0.7, 0.15 + (pH - 8.2) * 0.35);
                    return { color: `rgba(236, 72, 153, ${alpha})`, text: 'Rosa Claro — Ponto Final ✨' };
                }
                return { color: 'rgba(236, 72, 153, 0.9)', text: 'Rosa Intenso (Excesso de Base)' };
            } else {
                // Base titulada com ácido: rosa inicial que descolore
                if (pH > 10.0) return { color: 'rgba(236, 72, 153, 0.85)', text: 'Rosa (Meio Básico)' };
                if (pH >= 8.2 && pH <= 10.0) return { color: 'rgba(236, 72, 153, 0.3)', text: 'Rosa Claro (Zona de Viragem)' };
                return { color: 'transparent', text: 'Incolor (Ponto Final Atingido)' };
            }
        } else {
            // Indicador Universal
            if (pH <= 3) return { color: 'rgba(239, 68, 68, 0.6)', text: 'Vermelho (Ácido Forte)' };
            if (pH > 3 && pH < 6) return { color: 'rgba(245, 158, 11, 0.6)', text: 'Laranja/Amarelo (Ácido Fraco)' };
            if (pH >= 6 && pH <= 8) return { color: 'rgba(16, 185, 129, 0.6)', text: 'Verde (Neutro)' };
            if (pH > 8 && pH <= 11) return { color: 'rgba(59, 130, 246, 0.6)', text: 'Azul (Básico)' };
            return { color: 'rgba(139, 92, 246, 0.6)', text: 'Violeta/Roxo (Base Forte)' };
        }
    },

    updateVisuals() {
        const currentPH = this.calculateCurrentPH();
        const spentDisplay = document.getElementById('volSpentDisplay');
        const phDisplay = document.getElementById('pHDisplay');
        const statusDisplay = document.getElementById('statusDisplay');
        const liquidBurette = document.getElementById('buretteLiquid');
        const liquidErlen = document.getElementById('erlenmeyerLiquid');
        const btnFinish = document.getElementById('btnFinishTrial');

        spentDisplay.innerText = `${this.volSpent.toFixed(2)} mL`;
        phDisplay.innerText = `${currentPH.toFixed(2)}`;

        // Nível da bureta (diminui proporcionalmente)
        const buretteRemaining = Math.max(0, this.buretteTotal - (this.buretteCurrent + this.volSpent));
        const buretteHeightPct = (buretteRemaining / this.buretteTotal) * 100;
        liquidBurette.style.height = `${buretteHeightPct}%`;
        liquidBurette.style.backgroundColor = 'rgba(2, 132, 199, 0.6)';

        // Nível do Erlenmeyer (aumenta proporcionalmente)
        const totalErlenVol = this.sampleVol + this.volSpent;
        const erlenHeightPct = Math.min(85, 40 + (totalErlenVol / 75) * 45);
        liquidErlen.style.height = `${erlenHeightPct}%`;

        const indStyle = this.getIndicatorStyle(currentPH);
        liquidErlen.style.backgroundColor = indStyle.color;
        statusDisplay.innerText = indStyle.text;

        // Liberar registro se próximo ao ponto de equivalência
        const acids = ['HCl', 'CH3COOH'];
        const isFlaskAcid = acids.includes(this.flaskSol);
        if(isFlaskAcid && currentPH >= 7.5 && currentPH <= 11.5) {
            btnFinish.disabled = false;
        } else if(!isFlaskAcid && currentPH <= 9.0 && currentPH >= 3.0) {
            btnFinish.disabled = false;
        } else {
            btnFinish.disabled = currentPH < 7.0 && isFlaskAcid;
        }
    },

    drawGraph() {
        const canvas = document.getElementById('titrationCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Margens
        const padding = 40;
        const graphWidth = width - 2 * padding;
        const graphHeight = height - 2 * padding;

        // Eixos
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Rótulos
        ctx.fillStyle = '#1e293b';
        ctx.font = '11px Segoe UI';
        ctx.fillText('pH (0-14)', 10, padding - 5);
        ctx.fillText('Volume Adicionado (mL)', width - 130, height - 10);

        // Escalas (X: 0 a 50 mL, Y: 0 a 14 pH)
        const maxX = 50.0;
        const maxY = 14.0;

        const scaleX = (val) => padding + (val / maxX) * graphWidth;
        const scaleY = (val) => height - padding - (val / maxY) * graphHeight;

        // Destacar faixa de viragem da fenolftaleína (pH 8.2 a 10.0)
        if(this.indicator === 'phenolphthalein') {
            ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
            const yTop = scaleY(10.0);
            const yBot = scaleY(8.2);
            ctx.fillRect(padding, yTop, graphWidth, yBot - yTop);

            ctx.fillStyle = '#db2777';
            ctx.font = '10px Segoe UI';
            ctx.fillText('Faixa Fenolftaleína (pH 8.2 - 10.0)', padding + 10, yTop + 12);
        }

        // Linha vertical do Ponto de Equivalência Teórico
        const xEq = scaleX(this.exactEquivVolume);
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xEq, padding);
        ctx.lineTo(xEq, height - padding);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = '10px Segoe UI';
        ctx.fillText(`V(eq): ${this.exactEquivVolume.toFixed(2)} mL`, xEq + 5, padding + 15);

        // Desenhar a curva teórica de titulação em tempo real
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let isFirst = true;
        for (let v = 0; v <= 50; v += 0.5) {
            // Simular pH temporário para cada ponto v
            const oldVol = this.volSpent;
            this.volSpent = v;
            const phVal = this.calculateCurrentPH();
            this.volSpent = oldVol; // restaurar

            const px = scaleX(v);
            const py = scaleY(phVal);

            if (isFirst) {
                ctx.moveTo(px, py);
                isFirst = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();

        // Ponto atual do experimento no gráfico
        const currentPH = this.calculateCurrentPH();
        const currX = scaleX(this.volSpent);
        const currY = scaleY(currentPH);

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(currX, currY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    resetFlask() {
        this.stopFlow();
        this.volSpent = 0.00;
        this.isStopcockOpen = false;
        document.getElementById('btnStopcock').innerText = "Abrir Torneira";
        document.getElementById('btnStopcock').style.backgroundColor = "var(--emerald)";
        this.updateVisuals();
        this.drawGraph();
    },

    finishTrial() {
        this.stopFlow();
        document.getElementById('calcSection').style.display = 'block';
        document.getElementById('calcSection').classList.remove('hidden');
        document.getElementById('calcVTitrant').value = this.volSpent.toFixed(2);
        document.getElementById('calcVSample').value = this.sampleVol.toFixed(2);
        
        const knownVal = (this.concMode === 'unknown_titrand') ? this.knownConc : this.knownConc;
        document.getElementById('calcKnownC').value = knownVal.toFixed(4);
    },

    checkCalculations() {
        const userVal = parseFloat(document.getElementById('userResultInput').value);
        const feedback = document.getElementById('calcFeedback');
        feedback.classList.remove('hidden');

        if(isNaN(userVal)) {
            feedback.innerHTML = `<span style="color:var(--danger)">Insira um valor numérico válido.</span>`;
            return;
        }

        // Cálculo estequiométrico correto (1:1)
        // C_desconhecida * V_amostra = C_conhecida * V_gasto
        let correctVal = 0;
        const knownVal = this.knownConc;
        if(this.concMode === 'unknown_titrand') {
            correctVal = (knownVal * this.volSpent) / this.sampleVol;
        } else {
            correctVal = (knownVal * this.sampleVol) / this.volSpent; // se titulante for desconhecido
        }

        const errorPercent = Math.abs((userVal - correctVal) / correctVal) * 100;
        const realTarget = this.unknownConc;
        const absoluteError = Math.abs(userVal - realTarget);

        if(errorPercent <= 3.0) {
            feedback.innerHTML = `<strong style="color:var(--emerald-dark)">Parabéns! Excelente precisão experimental.</strong><br>` +
                `Valor calculado correto: <strong>${correctVal.toFixed(4)} mol/L</strong>.<br>` +
                `Valor real interno: <strong>${realTarget.toFixed(4)} mol/L</strong> (Erro absoluto: ${absoluteError.toFixed(4)}).`;
            
            App.addScore(40);

            this.trials.push({
                trialNum: this.currentTrialIndex,
                init: this.buretteCurrent.toFixed(2),
                final: (this.buretteCurrent + this.volSpent).toFixed(2),
                spent: this.volSpent.toFixed(2),
                calc: userVal.toFixed(4)
            });

            this.renderTrialsTable();
            document.getElementById('calcSection').classList.add('hidden');
            document.getElementById('calcSection').style.display = 'none';

        } else {
            feedback.innerHTML = `<strong style="color:var(--warning)">Atenção ao cálculo:</strong> O valor calculado difere do esperado.<br>` +
                `Revise a proporção estequiométrica $C_1 V_1 = C_2 V_2$ e a conversão de unidades. Tente novamente!`;
        }
    },

    renderTrialsTable() {
        const tbody = document.querySelector('#trialsTable tbody');
        tbody.innerHTML = "";

        let sumCalc = 0;
        this.trials.forEach(t => {
            sumCalc += parseFloat(t.calc);
            tbody.innerHTML += `<tr>
                <td>${t.trialNum}</td>
                <td>${t.init} mL</td>
                <td>${t.final} mL</td>
                <td>${t.spent} mL</td>
                <td>${t.calc} mol/L</td>
            </tr>`;
        });

        if(this.trials.length >= 3) {
            const avg = sumCalc / this.trials.length;
            const errorReal = Math.abs((avg - this.unknownConc) / this.unknownConc) * 100;
            document.getElementById('statsSummary').innerHTML = `
                <div class="alert-box">
                    <strong>Relatório Estatístico Final:</strong><br>
                    Média das concentrações obtidas: <strong>${avg.toFixed(4)} mol/L</strong><br>
                    Concentração Real Padrão: <strong>${this.unknownConc.toFixed(4)} mol/L</strong><br>
                    Erro Relativo Médio: <strong>${errorReal.toFixed(2)}%</strong>. Excelente trabalho analítico!
                </div>
            `;
            App.addScore(50);
        }
    }
};

// Minijogos complementares preservados
const MiniGamePH = {
    init() {
        const container = document.getElementById('phContent');
        container.innerHTML = `
            <p>Determine o pH da solução selecionada e analise o comportamento dos íons hidrônio.</p>
            <div class="control-group">
                <label>Selecione a Solução:</label>
                <select id="phSolSelect" onchange="MiniGamePH.updateSolution()">
                    <option value="vinagre">Ácido Acético (Vinagre 0,1 mol/L)</option>
                    <option value="soda">Hidróxido de Sódio 0,05 mol/L</option>
                    <option value="agua">Água Pura (Neutra)</option>
                </select>
            </div>
            <div id="phResult" class="mt-4" style="background: #f1f5f9; padding: 1rem; border-radius: 6px;">
                <strong>pH Estimado:</strong> <span id="phValText">2,88 (Ácido Fraco)</span>
            </div>
        `;
        App.goToScreen('screen-ph');
    },
    updateSolution() {
        const val = document.getElementById('phSolSelect').value;
        const text = document.getElementById('phValText');
        if(val === 'vinagre') text.innerText = "2,88 (Ácido Fraco — Papel Indicador: Vermelho/Laranja)";
        else if(val === 'soda') text.innerText = "12,70 (Base Forte — Papel Indicador: Azul/Roxo)";
        else text.innerText = "7,00 (Neutro — Papel Indicador: Verde)";
        App.addScore(10);
    }
};

const MiniGameDilution = {
    init() {
        const container = document.getElementById('dilutionContent');
        container.innerHTML = `
            <p>Você precisa preparar <strong>500 mL</strong> de uma solução de HCl a <strong>0,10 mol/L</strong> a partir de um estoque concentrado de HCl a <strong>2,0 mol/L</strong>.</p>
            <div class="control-group">
                <label>Qual volume da solução concentrada (V₁) em mL você deve pipetar?</label>
                <input type="number" id="dilV1Input" placeholder="Ex: 25">
            </div>
            <button class="btn mt-4" onclick="MiniGameDilution.check()">Verificar Resposta</button>
            <div id="dilFeedback" class="mt-4"></div>
        `;
        App.goToScreen('screen-dilution');
    },
    check() {
        const val = parseFloat(document.getElementById('dilV1Input').value);
        const fb = document.getElementById('dilFeedback');
        if(Math.abs(val - 25) < 0.5) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Correto!</strong> Pipetou-se 25 mL e avolumou-se para 500 mL no balão volumétrico.`;
            App.addScore(25);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> Utilize V₁ = (C₂ × V₂) / C₁ = (0,10 × 500) / 2,0 = 25 mL.`;
        }
    }
};

const MiniGameStoich = {
    init() {
        const container = document.getElementById('stoichContent');
        container.innerHTML = `
            <p>Dada a reação de neutralização: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O</p>
            <p>Quantos mols de NaOH são necessários para neutralizar completamente <strong>1,5 mols</strong> de H₂SO₄?</p>
            <div class="control-group">
                <input type="number" id="stoichInput" step="0.1" placeholder="Ex: 3.0">
            </div>
            <button class="btn mt-4" onclick="MiniGameStoich.check()">Verificar</button>
            <div id="stoichFeedback" class="mt-4"></div>
        `;
        App.goToScreen('screen-stoich');
    },
    check() {
        const val = parseFloat(document.getElementById('stoichInput').value);
        const fb = document.getElementById('stoichFeedback');
        if(Math.abs(val - 3.0) < 0.1) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Correto!</strong> A proporção é de 1 mol de ácido para 2 mols de base (1.5 × 2 = 3.0 mols).`;
            App.addScore(25);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> A proporção estequiométrica é 1:2. Tente novamente!`;
        }
    }
};

const MiniGamePrep = {
    init() {
        const container = document.getElementById('prepContent');
        container.innerHTML = `
            <p>Calcule a massa de NaCl (Massa Molar = 58,44 g/mol) necessária para preparar <strong>250 mL</strong> de solução a <strong>0,50 mol/L</strong>.</p>
            <div class="control-group">
                <label>Massa em gramas (g):</label>
                <input type="number" id="prepInput" step="0.01" placeholder="Ex: 7.31">
            </div>
            <button class="btn mt-4" onclick="MiniGamePrep.check()">Verificar Pesagem</button>
            <div id="prepFeedback" class="mt-4"></div>
        `;
        App.goToScreen('screen-prep');
    },
    check() {
        const val = parseFloat(document.getElementById('prepInput').value);
        const fb = document.getElementById('prepFeedback');
        if(Math.abs(val - 7.31) <= 0.05) {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Perfeito!</strong> m = C × V × MM = 7,305 g. Procedimento correto.`;
            App.addScore(30);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> Lembre-se: m = C × V × MM.`;
        }
    }
};

const MiniGameInvestigation = {
    init() {
        const container = document.getElementById('investigationContent');
        container.innerHTML = `
            <p>Você recebeu uma amostra líquida desconhecida <strong>#A</strong>. Realize testes para identificá-la entre: <strong>Ácido Clorídrico</strong>, <strong>Cloreto de Sódio</strong> ou <strong>Hidróxido de Sódio</strong>.</p>
            <div class="control-group">
                <label>Selecione o Teste Laboratorial:</label>
                <select id="invTestSelect">
                    <option value="ph">Medição de pH com Papel Indicador</option>
                    <option value="agno3">Teste com Nitrato de Prata (AgNO₃)</option>
                </select>
            </div>
            <button class="btn mt-4" onclick="MiniGameInvestigation.runTest()">Executar Teste</button>
            <div id="invResult" class="mt-4" style="background: #f1f5f9; padding: 1rem; border-radius: 6px;"></div>
            
            <div class="control-group mt-4">
                <label>Conclusão - Qual é a substância da amostra #A?</label>
                <select id="invGuessSelect">
                    <option value="hcl">Ácido Clorídrico</option>
                    <option value="nacl">Cloreto de Sódio</option>
                    <option value="naoh">Hidróxido de Sódio</option>
                </select>
                <button class="btn mt-4" onclick="MiniGameInvestigation.checkGuess()">Enviar Conclusão</button>
            </div>
            <div id="invFinalFeedback" class="mt-4"></div>
        `;
        App.goToScreen('screen-investigation');
    },
    runTest() {
        const test = document.getElementById('invTestSelect').value;
        const res = document.getElementById('invResult');
        if(test === 'ph') {
            res.innerHTML = `<strong>Resultado do Teste de pH:</strong> Papel indicador virou para <strong>Vermelho intenso</strong> (pH ≈ 1). A amostra possui forte caráter ácido.`;
        } else {
            res.innerHTML = `<strong>Resultado com AgNO₃:</strong> Formação de precipitado branco (AgCl), indicando presença de íons cloreto (Cl⁻).`;
        }
        App.addScore(15);
    },
    checkGuess() {
        const guess = document.getElementById('invGuessSelect').value;
        const fb = document.getElementById('invFinalFeedback');
        if(guess === 'hcl') {
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Parabéns! Identificação correta.</strong> A amostra #A é o Ácido Clorídrico (apresenta caráter ácido e íons cloreto).`;
            App.addScore(35);
        } else {
            fb.innerHTML = `<strong style="color:var(--danger)">Incorreto.</strong> Analise novamente as evidências de pH ácido e testes de precipitação.`;
        }
    }
};
