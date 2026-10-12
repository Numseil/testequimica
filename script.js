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
        if(this.levelElem) levelElem.innerText = this.level;

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

// Módulo corrigido da Balança Analítica
const AnalyticalBalance = {
    isPoweredOn: true,
    container: null,
    solidType: 'KHP',
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
        this.solidType = document.getElementById('selSolidType').value;
        this.solidMass += amount;
        
        const solidDiv = document.getElementById('visualSolid');
        if(solidDiv) {
            const heightPct = Math.min(90, (this.solidMass / 5.0) * 90);
            solidDiv.style.height = `${heightPct}%`;
        }

        this.updateDisplay();
        this.updatePanel();
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
        document.getElementById('balGrossMass').innerText = `${this.getCurrentMass().toFixed(4)} g`;
        document.getElementById('balNetMass').innerText = `${this.solidMass.toFixed(4)} g`;
    },

    saveWeighingData() {
        if(!this.container || this.solidMass <= 0) {
            alert("Não há massa válida registrada.");
            return;
        }
        window.lastWeighedSolid = { type: this.solidType, netMass: this.solidMass };
        alert(`Pesagem registrada: ${this.solidMass.toFixed(4)} g de ${this.solidType} salvos!`);
        App.addScore(25);
    }
};

// Módulo corrigido de Preparo de Solução
const PrimaryStandardLab = {
    init() {
        App.goToScreen('screen-prep-standard');
        this.updateInfo();
        document.getElementById('prepTargetConc').addEventListener('input', () => this.updateInfo());
        document.getElementById('prepVolumeBallon').addEventListener('change', () => this.updateInfo());
    },

    getMolarMass(type) {
        return type === 'KHP' ? 204.22 : 105.99;
    },

    getPureza(type) {
        return type === 'KHP' ? 0.999 : 0.998;
    },

    updateInfo() {
        const type = document.getElementById('prepStandardType').value;
        const C = parseFloat(document.getElementById('prepTargetConc').value) || 0.1;
        const V_mL = parseFloat(document.getElementById('prepVolumeBallon').value) || 250;
        const Mm = this.getMolarMass(type);
        const purity = this.getPureza(type);

        const mass = (C * (V_mL / 1000.0) * Mm) / purity;
        document.getElementById('spanTheoreticalMass').innerText = mass.toFixed(4);

        const weighed = window.lastWeighedSolid && window.lastWeighedSolid.type === type ? window.lastWeighedSolid.netMass : 0.0000;
        document.getElementById('spanWeighedMass').innerText = weighed.toFixed(4);
    },

    executePreparation() {
        const type = document.getElementById('prepStandardType').value;
        const C_target = parseFloat(document.getElementById('prepTargetConc').value);
        const V_mL = parseFloat(document.getElementById('prepVolumeBallon').value);
        const Mm = this.getMolarMass(type);
        const purity = this.getPureza(type);

        const V_L = V_mL / 1000.0;
        const theoreticalMass = (C_target * V_L * Mm) / purity;

        const actualMass = window.lastWeighedSolid && window.lastWeighedSolid.type === type ? 
            window.lastWeighedSolid.netMass : (theoreticalMass * (0.995 + Math.random() * 0.01));

        const realConc = (actualMass * purity) / (Mm * V_L);

        window.preparedPrimaryStandard = { solute: type, actualMass, volumeL: V_L, concentration: realConc };

        document.getElementById('prepResultFeedback').innerHTML = `<div class="alert-box">
            <strong>Solução Preparada com Sucesso!</strong><br>
            Massa Efetiva: <strong>${actualMass.toFixed(4)} g</strong><br>
            Concentração Real Efetiva: <strong>${realConc.toFixed(4)} mol/L</strong>
        </div>`;
        App.addScore(40);
    }
};

// Módulo corrigido de Padronização de Titulantes
const StandardizationLab = {
    init() {
        App.goToScreen('screen-standardization');
    },

    calculateStandardization() {
        const system = document.getElementById('stdSystemSelect').value;
        const mass = parseFloat(document.getElementById('stdMassInput').value);
        const vSpent = parseFloat(document.getElementById('stdVolSpentInput').value);
        const fb = document.getElementById('stdFeedback');

        if(isNaN(mass) || isNaN(vSpent) || vSpent <= 0) {
            fb.innerHTML = `<span style="color:var(--danger)">Insira valores numéricos válidos.</span>`;
            return;
        }

        let conc = 0;
        if(system === 'NaOH_KHP') {
            // KHP (MM = 204.22, pureza 99.9%) + NaOH (1:1)
            // n_KHP = (mass * 0.999) / 204.22 = n_NaOH = C * (vSpent / 1000)
            const nKHP = (mass * 0.999) / 204.22;
            conc = nKHP / (vSpent / 1000.0);
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Padronização de NaOH Concluída!</strong><br>` +
                `Concentração real de $\text{NaOH}$: <strong>${conc.toFixed(4)} mol/L</strong> (Proporção 1:1).`;
        } else {
            // Na2CO3 (MM = 105.99, pureza 99.8%) + 2 HCl (1:2)
            // n_Na2CO3 = (mass * 0.998) / 105.99 => n_HCl = 2 * n_Na2CO3 = C * (vSpent / 1000)
            const nNa2CO3 = (mass * 0.998) / 105.99;
            const nHCl = 2 * nNa2CO3;
            conc = nHCl / (vSpent / 1000.0);
            fb.innerHTML = `<strong style="color:var(--emerald-dark)">Padronização de HCl Concluída!</strong><br>` +
                `Concentração real de $\text{HCl}$: <strong>${conc.toFixed(4)} mol/L</strong> (Proporção 1:2).`;
        }
        App.addScore(45);
    }
};

// Módulo de Titulação Ácido-Base
const TitrationLab = {
    flaskSol: 'HCl',
    buretteSol: 'NaOH',
    sampleVol: 25.00,
    buretteTotal: 50.00,
    buretteCurrent: 0.00,
    volSpent: 0.00,
    isStopcockOpen: false,
    animationInterval: null,
    trials: [],
    currentTrialIndex: 1,
    exactEquivVolume: 25.00,
    cFlask: 0.1000,
    cBurette: 0.1000,

    openConfig() {
        App.goToScreen('screen-titration-config');
    },

    startFromConfig() {
        this.flaskSol = document.getElementById('cfgFlaskSolution').value;
        this.buretteSol = document.getElementById('cfgBuretteSolution').value;
        this.sampleVol = parseFloat(document.getElementById('cfgSampleVol').value) || 25.00;

        this.cBurette = 0.1000;
        this.cFlask = parseFloat((0.080 + Math.random() * 0.040).toFixed(4));
        this.exactEquivVolume = (this.cFlask * this.sampleVol) / this.cBurette;

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

    addDrop() { this.addVolume(0.05); this.triggerDropAnim(); },
    addSmall() { this.addVolume(0.10); this.triggerDropAnim(); },
    addStream() { this.addVolume(1.00); this.triggerDropAnim(); },

    triggerDropAnim() {
        const drop = document.getElementById('dropElement');
        drop.style.backgroundColor = 'rgba(2, 132, 199, 0.7)';
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

    calculateCurrentPH() {
        const acids = ['HCl', 'CH3COOH'];
        const isFlaskAcid = acids.includes(this.flaskSol);
        const nFlask = this.cFlask * this.sampleVol;
        const nBurette = this.cBurette * this.volSpent;
        const totalV = this.sampleVol + this.volSpent;

        if(isFlaskAcid) {
            if(nBurette < nFlask) {
                const excessH = (nFlask - nBurette) / totalV;
                return Math.max(0, Math.min(14, -Math.log10(excessH)));
            } else if(Math.abs(nBurette - nFlask) < 1e-5) {
                return 7.00;
            } else {
                const excessOH = (nBurette - nFlask) / totalV;
                const pOH = -Math.log10(excessOH);
                return Math.max(0, Math.min(14, 14.00 - pOH));
            }
        } else {
            if(nBurette < nFlask) {
                const excessOH = (nFlask - nBurette) / totalV;
                const pOH = -Math.log10(excessOH);
                return Math.max(0, Math.min(14, 14.00 - pOH));
            } else if(Math.abs(nBurette - nFlask) < 1e-5) {
                return 7.00;
            } else {
                const excessH = (nBurette - nFlask) / totalV;
                return Math.max(0, Math.min(14, -Math.log10(excessH)));
            }
        }
    },

    updateVisuals() {
        const currentPH = this.calculateCurrentPH();
        document.getElementById('volSpentDisplay').innerText = `${this.volSpent.toFixed(2)} mL`;
        document.getElementById('pHDisplay').innerText = `${currentPH.toFixed(2)}`;

        const liquidBurette = document.getElementById('buretteLiquid');
        const liquidErlen = document.getElementById('erlenmeyerLiquid');
        const btnFinish = document.getElementById('btnFinishTrial');

        const buretteRemaining = Math.max(0, this.buretteTotal - (this.buretteCurrent + this.volSpent));
        liquidBurette.style.height = `${(buretteRemaining / this.buretteTotal) * 100}%`;
        liquidBurette.style.backgroundColor = 'rgba(2, 132, 199, 0.6)';

        const totalErlenVol = this.sampleVol + this.volSpent;
        liquidErlen.style.height = `${Math.min(85, 40 + (totalErlenVol / 75) * 45)}%`;

        let colorHex = "transparent";
        let statusText = "Incolor";
        if(currentPH >= 8.2 && currentPH <= 9.8) {
            colorHex = "rgba(236, 72, 153, 0.45)";
            statusText = "Rosa Claro — Ponto Final ✨";
            btnFinish.disabled = false;
        } else if(currentPH > 9.8) {
            colorHex = "rgba(236, 72, 153, 0.85)";
            statusText = "Rosa Intenso (Excesso)";
            btnFinish.disabled = false;
        } else {
            btnFinish.disabled = currentPH < 7.5;
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

        const scaleX = (val) => padding + (val / 50.0) * graphWidth;
        const scaleY = (val) => height - padding - (val / 14.0) * graphHeight;

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let isFirst = true;
        for (let v = 0; v <= 50; v += 0.5) {
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
    },

    checkCalculations() {
        const userVal = parseFloat(document.getElementById('userResultInput').value);
        const feedback = document.getElementById('calcFeedback');
        feedback.classList.remove('hidden');

        if(isNaN(userVal)) {
            feedback.innerHTML = `<span style="color:var(--danger)">Insira um valor numérico válido.</span>`;
            return;
        }

        const correctVal = (this.cBurette * this.volSpent) / this.sampleVol;
        const errorPercent = Math.abs((userVal - correctVal) / correctVal) * 100;

        if(errorPercent <= 3.0) {
            feedback.innerHTML = `<strong style="color:var(--emerald-dark)">Parabéns! Excelente precisão analítica.</strong><br>` +
                `Valor calculado correto: <strong>${correctVal.toFixed(4)} mol/L</strong>.`;
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
            feedback.innerHTML = `<strong style="color:var(--warning)">Atenção:</strong> O valor calculado difere do esperado. Revise $C_1V_1 = C_2V_2$.`;
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
            document.getElementById('statsSummary').innerHTML = `
                <div class="alert-box">
                    <strong>Relatório Estatístico Final:</strong><br>
                    Média das concentrações: <strong>${avg.toFixed(4)} mol/L</strong>. Excelente desempenho!
                </div>
            `;
            App.addScore(50);
        }
    }
};
