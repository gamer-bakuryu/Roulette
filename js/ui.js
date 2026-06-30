/* ==============================================
   R O U L E T T E  —  UI SYSTEM
   ============================================== */

const UI = {
    el:{},

    /* ---- cache de elementos ---- */
    init(){
        const g = id => document.getElementById(id);
        this.el = {
            // screens
            scrStart:     g('screen-start'),
            scrRules:     g('screen-rules'),
            scrGame:      g('screen-game'),
            scrRoundEnd:  g('screen-round-end'),
            scrGameOver:  g('screen-game-over'),
            // nav buttons
            btnStart:     g('btn-start'),
            btnRules:     g('btn-rules'),
            btnBack:      g('btn-back-start'),
            btnNext:      g('btn-next-round'),
            btnRestart:   g('btn-restart'),
            // header
            roundNum:     g('round-number'),
            chamberVis:   g('chamber-visual'),
            scoreTxt:     g('score-display'),
            // arena
            pCard:        g('player-card'),
            aCard:        g('ai-card'),
            pHpFill:      g('player-hp-fill'),
            pHpTxt:       g('player-hp-text'),
            aHpFill:      g('ai-hp-fill'),
            aHpTxt:       g('ai-hp-text'),
            pStatus:      g('player-status'),
            aStatus:      g('ai-status'),
            device:       g('device-visual'),
            turnInd:      g('turn-indicator'),
            // reveal
            revealBox:    g('reveal-box'),
            revealTxt:    g('reveal-text'),
            // items
            itemsPanel:   g('items-panel'),
            pItems:       g('player-items'),
            // actions
            btnShootAi:   g('btn-shoot-ai'),
            btnShootSelf: g('btn-shoot-self'),
            // log
            logBody:      g('event-log'),
            btnClearLog:  g('btn-clear-log'),
            // round end
            reIcon:       g('round-end-icon'),
            reTitle:      g('round-end-title'),
            reMsg:        g('round-end-message'),
            reScore:      g('round-end-score'),
            // game over
            goIcon:       g('gameover-icon'),
            goTitle:      g('gameover-title'),
            goMsg:        g('gameover-message'),
            goScore:      g('gameover-score'),
            // notif
            notif:        g('notification'),
            notifTxt:     g('notification-text')
        };
    },

    /* ---- telas ---- */
    showScreen(id){
        document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
        const s = document.getElementById(id);
        if(s) s.classList.add('active');
    },

    /* ---- HP ---- */
    updateHP(who, cur, max){
        const fill = who==='player'? this.el.pHpFill : this.el.aHpFill;
        const txt  = who==='player'? this.el.pHpTxt  : this.el.aHpTxt;
        const pct  = Math.max(0, cur/max*100);
        fill.style.width = pct+'%';
        txt.textContent  = `${cur}/${max}`;

        if(pct<=25){
            fill.style.background = 'var(--red)';
            fill.style.boxShadow  = '0 0 10px rgba(204,51,51,.5)';
        } else if(pct<=50){
            fill.style.background = '#c83';
            fill.style.boxShadow  = '0 0 8px rgba(204,136,51,.35)';
        } else {
            fill.style.background = 'var(--green)';
            fill.style.boxShadow  = '0 0 8px rgba(51,170,102,.35)';
        }
    },

    /* ---- turno ---- */
    updateTurn(who){
        this.el.turnInd.textContent = who==='player'?'SUA VEZ':'VEZ DO DEALER';
        this.el.pCard.classList.toggle('active-turn', who==='player');
        this.el.aCard.classList.toggle('active-turn', who==='ai');
    },

    /* ---- câmara ---- */
    updateChamber(chamber, originalTotal){
        this.el.chamberVis.innerHTML = '';
        const spent = originalTotal - chamber.length;
        for(let i=0;i<spent;i++){
            const d=document.createElement('div');d.className='shell-dot spent';
            this.el.chamberVis.appendChild(d);
        }
        for(let i=0;i<chamber.length;i++){
            const d=document.createElement('div');d.className='shell-dot unknown';
            this.el.chamberVis.appendChild(d);
        }
    },

    /* ---- ações ---- */
    setActions(on){
        this.el.btnShootAi.disabled   = !on;
        this.el.btnShootSelf.disabled = !on;
    },

    /* ---- itens ---- */
    updateItems(items, onUse, enabled){
        this.el.pItems.innerHTML = '';
        if(!items.length){
            const s=document.createElement('span');
            s.style.cssText='color:var(--txt3);font-size:.65rem';
            s.textContent='Sem itens';
            this.el.pItems.appendChild(s);
            return;
        }
        items.forEach((type,i)=>{
            const d = ItemSystem.getData(type);
            const b = document.createElement('button');
            b.className = 'item-btn';
            b.disabled  = !enabled;
            b.title     = d.desc;
            b.innerHTML = `<span class="ii">${d.icon}</span>${d.name}`;
            b.addEventListener('click',()=>{ if(!b.disabled && onUse) onUse(i); });
            this.el.pItems.appendChild(b);
        });
    },

    /* ---- log ---- */
    log(msg, cls='log-sys'){
        const d=document.createElement('div');
        d.className=`log-line ${cls}`;
        d.textContent=msg;
        this.el.logBody.appendChild(d);
        this.el.logBody.scrollTop=this.el.logBody.scrollHeight;
    },
    clearLog(){this.el.logBody.innerHTML=''},

    /* ---- animações ---- */
    flashDamage(who){
        const c=who==='player'?this.el.pCard:this.el.aCard;
        c.classList.add('hit');setTimeout(()=>c.classList.remove('hit'),550);
    },
    flashHeal(who){
        const c=who==='player'?this.el.pCard:this.el.aCard;
        c.classList.add('heal');setTimeout(()=>c.classList.remove('heal'),550);
    },
    fireDevice(){
        this.el.device.classList.add('firing');
        setTimeout(()=>this.el.device.classList.remove('firing'),400);
    },

    /* ---- reveal ---- */
    showReveal(type){
        const color = type==='red'?'var(--red)':'var(--blue)';
        const name  = type==='red'?'🔴 VERMELHO':'🔵 AZUL';
        this.el.revealTxt.innerHTML = `Próximo: <span style="color:${color};font-weight:700">${name}</span>`;
        this.el.revealBox.classList.remove('hidden');
    },
    hideReveal(){this.el.revealBox.classList.add('hidden')},

    /* ---- status ---- */
    setStatus(who, txt){
        (who==='player'?this.el.pStatus:this.el.aStatus).textContent=txt;
    },

    /* ---- header updates ---- */
    setRound(n){this.el.roundNum.textContent=n},
    setScore(pw,aw){this.el.scoreTxt.textContent=`${pw} — ${aw}`},

    /* ---- round end ---- */
    showRoundEnd(winner, round, pw, aw){
        const w = winner==='player';
        this.el.reIcon.textContent = w?'✓':'✗';
        this.el.reIcon.style.color = w?'var(--green)':'var(--red)';
        this.el.reTitle.textContent = `FIM DA RODADA ${round}`;
        this.el.reMsg.textContent = w?'Você venceu esta rodada!':'O Dealer venceu esta rodada.';
        this.el.reScore.textContent = `PLACAR: ${pw} — ${aw}`;
        this.el.btnNext.textContent = round<3?'PRÓXIMA RODADA →':'VER RESULTADO →';
        this.showScreen('screen-round-end');
    },

    /* ---- game over ---- */
    showGameOver(winner, pw, aw){
        if(winner==='player'){
            this.el.goIcon.textContent  = '🏆';
            this.el.goTitle.textContent = 'VITÓRIA!';
            this.el.goMsg.textContent   = 'Você sobreviveu à Roulette.';
        } else if(winner==='ai'){
            this.el.goIcon.textContent  = '💀';
            this.el.goTitle.textContent = 'DERROTA';
            this.el.goMsg.textContent   = 'O Dealer prevaleceu.';
        } else {
            this.el.goIcon.textContent  = '⚖️';
            this.el.goTitle.textContent = 'EMPATE';
            this.el.goMsg.textContent   = 'Nenhum lado venceu.';
        }
        this.el.goScore.textContent = `PLACAR FINAL: ${pw} — ${aw}`;
        this.showScreen('screen-game-over');
    },

    /* ---- notificação ---- */
    _notifTimer:null,
    notify(msg, ms=2200){
        this.el.notifTxt.textContent = msg;
        this.el.notif.classList.remove('hidden');
        clearTimeout(this._notifTimer);
        this._notifTimer = setTimeout(()=>this.el.notif.classList.add('hidden'), ms);
    }
};
