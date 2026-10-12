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

// Inicializar dados salvos ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Módulo de Simulação de Titulação Ácido-Base
const TitrationLab = {
    cHCl: 0.1000, 
    vHCl: 25.00,  
    cNaOH: 0.1000,
    
    buretteTotal: 50.00,
    buretteCurrent: 0.00, 
    volSpent: 0.00,
    isStopcockOpen: false,
    animationInterval: null,
    trials: [],
    currentTrialIndex: 1,
    exactEquivVolume: 25.00,

    init() {
        this.cHCl = parseFloat((0.085 + Math.random() * 0.030).toFixed(4));
        this.exactEquivVolume = (this.cHCl * this.vHCl) / this.cNaOH;
        
        this.buretteCurrent = parseFloat((Math.random() * 5).toFixed(2)); 
        this.volSpent = 0.00;
        this.currentTrialIndex = this.trials.length + 1;

        if(this.currentTrialIndex > 3) {
            alert("Você já concluiu as 3 tentativas recomendadas! Reiniciando série de testes.");
            this.trials = [];
            this.currentTrialIndex = 1;
        }

        document.getElementById('trialNumber').innerText = `${this.currentTrialIndex} de 3`;
        document.getElementById('volInitialDisplay').innerText = `${this.buretteCurrent.toFixed(2)} mL`;
        document.getElementById('volSpentDisplay').innerText = `0,00 mL`;
        document.getElementById('calcSection').classList.add('hidden');
        document.getElementById('calcSection').style.display = 'none';
        document.getElementById('btnFinishTrial').disabled = true;

        App.goToScreen('screen-titration');
        this.updateVisuals();
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

    addStream() {
        this.addVolume(1.00);
        this.triggerDropAnim();
    },

    triggerDropAnim() {
        const drop = document.getElementById('dropElement');
        drop.classList.remove('falling');
        void drop.offsetWidth; 
        drop.classList.add('falling');
    },

    addVolume(amount) {
        if(this.volSpent + this.exactEquivVolume + 5 >= 50 && this.buretteCurrent + this.volSpent >= 50) {
            alert("Bureta vazia!");
            this.stopFlow();
            return;
        }
        this.volSpent += amount;
        this.updateVisuals();
    },

    calculateCurrentPH() {
        const molesH = this.cHCl * this.vHCl; 
        const molesOH = this.cNaOH * this.volSpent; 
        const totalV = this.vHCl + this.volSpent; 

        if(molesOH < molesH) {
            const excessH = (molesH - molesOH) / totalV; 
            const pH = -Math.log10(excessH);
            return Math.max(0, Math.min(14, pH));
        } else if(Math.abs(molesOH - molesH) < 1e-5) {
            return 7.00;
        } else {
            const excessOH = (molesOH - molesH) / totalV;
            const pOH = -Math.log10(excessOH);
            const pH = 14.00 - pOH;
            return Math.max(0, Math.min(14, pH));
        }
    },

    updateVisuals() {
        const currentPH = this.calculateCurrentPH();
        const spentDisplay = document.getElementById('volSpentDisplay');
        const phDisplay = document.getElementById('pHDisplay');
        const statusDisplay = document.getElementById('statusDisplay');
        const liquidErlen = document.getElementById('erlenmeyerLiquid');
        const btnFinish = document.getElementById('btnFinishTrial');

        spentDisplay.innerText = `${this.volSpent.toFixed(2)} mL`;
        phDisplay.innerText = `${currentPH.toFixed(2)}`;

        let colorHex = "transparent";
        let statusText = "Incolor (Ácido)";

        if(currentPH >= 8.2 && currentPH <= 9.8) {
            colorHex = "rgba(244, 114, 182, 0.45)"; 
            statusText = "Rosa Claro — Ponto Final Atingido! ✨";
            btnFinish.disabled = false;
        } else if(currentPH > 9.8) {
            colorHex = "rgba(236, 72, 153, 0.85)"; 
            statusText = "Rosa Forte (Excesso de Base)";
            btnFinish.disabled = false;
        } else {
            colorHex = "transparent";
            statusText = currentPH < 7 ? "Incolor (Meio Ácido)" : "Incolor (Próximo à neutralidade)";
            btnFinish.disabled = currentPH < 7.5; 
        }

        liquidErlen.style.backgroundColor = colorHex;
        statusDisplay.innerText = statusText;
    },

    resetFlask() {
        this.stopFlow();
        this.volSpent = 0.00;
        this.isStopcockOpen = false;
        document.getElementById('btnStopcock').innerText = "Abrir Torneira";
        document.getElementById('btnStopcock').style.backgroundColor = "var(--emerald)";
        this.updateVisuals();
    },

    finishTrial() {
        this.stopFlow();
        document.getElementById('calcSection').style.display = 'block';
        document.getElementById('calcSection').classList.remove('hidden');
        document.getElementById('calcVNaOH').value = this.volSpent.toFixed(2);
        document.getElementById('calcVHCl').value = this.vHCl.toFixed(2);
        document.getElementById('calcCNaOH').value = this.cNaOH.toFixed(4);
    },

    checkCalculations() {
        const userVal = parseFloat(document.getElementById('userCHCIInput').value);
        const feedback = document.getElementById('calcFeedback');
        feedback.classList.remove('hidden');

        if(isNaN(userVal)) {
            feedback.innerHTML = `<span style="color:var(--danger)">Insira um valor numérico válido para a concentração de HCl.</span>`;
            return;
        }

        const correctCHCL = (this.cNaOH * this.volSpent) / this.vHCl;
        const errorPercent = Math.abs((userVal - correctCHCL) / correctCHCL) * 100;

        if(errorPercent <= 2.5) {
            feedback.innerHTML = `<strong style="color:var(--emerald-dark)">Parabéns! Excelente precisão experimental.</strong><br>` +
                `O valor calculado correto é <strong>${correctCHCL.toFixed(4)} mol/L</strong>.<br>` +
                `O valor real gerado pelo simulador era <strong>${this.cHCl.toFixed(4)} mol/L</strong> (Diferença de ${Math.abs(userVal - this.cHCl).toFixed(4)} mol/L).`;
            
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
            feedback.innerHTML = `<strong style="color:var(--warning)">Atenção ao cálculo:</strong> O valor calculado difere do esperado (${correctCHCL.toFixed(4)} mol/L).<br>` +
                `Lembre-se da fórmula: C_HCl = (C_NaOH * V_NaOH) / V_HCl. Verifique se converteu os volumes corretamente e tente novamente!`;
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
            const errorReal = Math.abs((avg - this.cHCl) / this.cHCl) * 100;
            document.getElementById('statsSummary').innerHTML = `
                <div class="alert-box">
                    <strong>Relatório Estatístico Final:</strong><br>
                    Média das concentrações: <strong>${avg.toFixed(4)} mol/L</strong><br>
                    Concentração Real Oculta: <strong>${this.cHCl.toFixed(4)} mol/L</strong><br>
                    Erro Relativo Médio: <strong>${errorReal.toFixed(2)}%</strong>. Excelente concordância entre as titulações!
                </div>
            `;
            App.addScore(50);
        }
    }
};

// Minijogo 1: pH
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

// Minijogo 2: Diluição
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

// Minijogo 3: Estequiometria
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

// Minijogo 4: Preparo de Solução Sólida
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

// Minijogo 5: Investigação Laboratorial
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
