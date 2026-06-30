/* ==============================================
   R O U L E T T E  —  GAME ENGINE
   ============================================== */

const Game = {

    /* ---- configuração das rodadas ---- */
    cfg:{
        1:{ hp:2, seq:[{r:1,b:2},{r:3,b:2}],                         items:0 },
        2:{ hp:4, seq:[{r:1,b:1},{r:2,b:2},{r:3,b:2}],               items:2 },
        3:{ hp:6, seq:[{r:1,b:2},{r:4,b:4}], repeatLast:true,        items:4 }
    },

    state: null,

    /* ==========================
       INICIALIZAÇÃO
       ========================== */
    init(){
        UI.init();
        this._bind();
        UI.showScreen('screen-start');
    },

    _bind(){
        UI.el.btnStart.addEventListener('click', ()=>this.startGame());
        UI.el.btnRules.addEventListener('click', ()=>UI.showScreen('screen-rules'));
        UI.el.btnBack.addEventListener('click',  ()=>UI.showScreen('screen-start'));
        UI.el.btnNext.addEventListener('click',  ()=>this.nextRound());
        UI.el.btnRestart.addEventListener('click',()=>this.startGame());
        UI.el.btnClearLog.addEventListener('click',()=>UI.clearLog());
        UI.el.btnShootAi.addEventListener('click', ()=>this.playerShoot('ai'));
        UI.el.btnShootSelf.addEventListener('click',()=>this.playerShoot('player'));
    },

    /* ==========================
       NOVO JOGO
       ========================== */
    startGame(){
        this.state = {
            round:1, pWins:0, aWins:0,
            turn:'player',
            chamber:[], chamberTotal:0, seqIdx:0,
            roundMaxHp:0, busy:false,
            player:{ hp:0, items:[], sawActive:false, cuffed:false, knownNext:null },
            ai:    { hp:0, items:[], sawActive:false, cuffed:false, knownNext:null }
        };
        UI.clearLog();
        this.startRound(1);
    },

    /* ==========================
       INICIAR RODADA
       ========================== */
    startRound(n){
        const c = this.cfg[n];
        const s = this.state;
        s.round     = n;
        s.roundMaxHp= c.hp;
        s.seqIdx    = 0;

        // reset COMPLETO dos jogadores — HP, itens zerados, status limpos
        ['player','ai'].forEach(k=>{
            s[k].hp        = c.hp;
            s[k].items     = [];       // <-- ZERA TODOS OS ITENS
            s[k].sawActive = false;
            s[k].cuffed    = false;
            s[k].knownNext = null;
        });

        s.turn = n%2===1 ? 'player' : 'ai';

        UI.showScreen('screen-game');
        UI.setRound(n);
        UI.setScore(s.pWins, s.aWins);
        UI.updateHP('player', s.player.hp, c.hp);
        UI.updateHP('ai',     s.ai.hp,     c.hp);
        UI.setStatus('player','');
        UI.setStatus('ai','');
        UI.hideReveal();

        // Limpa o inventário visual imediatamente
        UI.clearItems();

        UI.log(`══════════ RODADA ${n} ══════════`,'log-sys');
        UI.log(`HP inicial: ${c.hp} para cada lado.`,'log-info');

        if(c.items === 0){
            UI.log('Nenhum item nesta rodada.','log-sys');
        }

        this._loadChamber();
        this._giveItems();
        this._startTurn();
    },

    /* ==========================
       CÂMARA
       ========================== */
    _loadChamber(){
        const s   = this.state;
        const c   = this.cfg[s.round];
        let idx   = s.seqIdx;

        if(idx >= c.seq.length){
            idx = c.repeatLast ? c.seq.length-1 : c.seq.length-1;
        }

        const def = c.seq[idx];
        s.chamber      = this._shuffle(def.r, def.b);
        s.chamberTotal = s.chamber.length;

        // limpar conhecimento
        s.player.knownNext = null;
        s.ai.knownNext     = null;
        UI.hideReveal();

        UI.log(`Câmara: ${def.r} vermelho(s), ${def.b} azul(is) → total ${s.chamberTotal}`,'log-sys');
        UI.updateChamber(s.chamber, s.chamberTotal);
    },

    _shuffle(r,b){
        const a=[];
        for(let i=0;i<r;i++) a.push('red');
        for(let i=0;i<b;i++) a.push('blue');
        for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
        return a;
    },

    /* ==========================
       ITENS
       ========================== */
    _giveItems(){
        const cnt = this.cfg[this.state.round].items;
        if(cnt<=0){
            // Sem itens nesta rodada — garante visual limpo
            UI.updateItems([],null,false);
            return;
        }

        const pNew = ItemSystem.generateRandom(cnt);
        const aNew = ItemSystem.generateRandom(cnt);
        const s = this.state;

        s.player.items = s.player.items.concat(pNew).slice(0,8);
        s.ai.items     = s.ai.items.concat(aNew).slice(0,8);

        UI.log(`Itens distribuídos: ${cnt} para cada lado.`,'log-info');
        const names = pNew.map(t=>{ const d=ItemSystem.getData(t); return d.icon+d.name; }).join(', ');
        UI.log(`Seus itens: ${names}`,'log-player');

        this._refreshItems();
    },

    _refreshItems(){
        const s  = this.state;
        const on = s.turn==='player' && !s.busy;
        UI.updateItems(s.player.items, idx=>this.playerUseItem(idx), on);
    },

    /* ==========================
       TURNO
       ========================== */
    _startTurn(){
        const s = this.state;
        s.busy  = false;

        // câmara vazia → reabastecer
        if(s.chamber.length===0){
            s.seqIdx++;
            UI.log('Câmara vazia — recarregando…','log-sys');
            this._giveItems();
            this._loadChamber();
        }

        // alguém morreu?
        if(s.player.hp<=0 || s.ai.hp<=0){ this._endRound(); return; }

        const cur = s.turn;

        // algemado?
        if(s[cur].cuffed){
            s[cur].cuffed = false;
            const nm = cur==='player'?'Você está':'Dealer está';
            UI.log(`⛓️ ${nm} algemado! Turno perdido.`,'log-dmg');
            UI.setStatus(cur,'⛓️ ALGEMADO');
            UI.updateTurn(cur);
            setTimeout(()=>{
                UI.setStatus(cur,'');
                s.turn = cur==='player'?'ai':'player';
                this._startTurn();
            },1400);
            return;
        }

        UI.updateTurn(cur);
        this._refreshStatuses();

        if(cur==='player'){
            UI.setActions(true);
            this._refreshItems();
            UI.log('─── Sua vez ───','log-sys');
        } else {
            UI.setActions(false);
            this._refreshItems();
            UI.log('─── Vez do Dealer… ───','log-sys');
            setTimeout(()=>this._aiTurn(),1100);
        }
    },

    _refreshStatuses(){
        const s = this.state;
        ['player','ai'].forEach(k=>{
            const parts=[];
            if(s[k].sawActive)  parts.push('🔪 Serra');
            if(s[k].cuffed)     parts.push('⛓️ Algemado');
            if(k==='player' && s[k].knownNext){
                parts.push('🔍 '+( s[k].knownNext==='red'?'🔴':'🔵'));
            }
            UI.setStatus(k, parts.join(' · '));
        });
    },

    /* ==========================
       JOGADOR USA ITEM
       ========================== */
    playerUseItem(idx){
        const s = this.state;
        if(s.turn!=='player' || s.busy) return;
        const type = s.player.items[idx];
        if(!type) return;

        ItemSystem.removeAt(s.player.items, idx);
        const res = ItemSystem.apply(type, s, 'player');

        UI.log(res.msg, res.log);
        if(type===ItemTypes.CIGARETTE && res.ok){ UI.flashHeal('player'); UI.updateHP('player',s.player.hp,s.roundMaxHp); }
        if(type===ItemTypes.MAGNIFIER && res.reveal) UI.showReveal(res.reveal);
        if(type===ItemTypes.ENERGY_DRINK && res.ok) UI.updateChamber(s.chamber, s.chamberTotal);

        this._refreshItems();
        this._refreshStatuses();
        UI.notify(res.msg,2200);
    },

    /* ==========================
       JOGADOR ATIRA
       ========================== */
    playerShoot(target){
        const s = this.state;
        if(s.turn!=='player' || s.busy) return;
        s.busy = true;
        UI.setActions(false);
        UI.updateItems(s.player.items,null,false);
        this._fire('player',target);
    },

    /* ==========================
       IA
       ========================== */
    _aiTurn(){
        if(this.state.turn!=='ai') return;
        const dec = AI.decide(this.state);

        if(dec.action==='use_item')      this._aiUseItem(dec.idx);
        else if(dec.action==='shoot_player') this._fire('ai','player');
        else                                  this._fire('ai','ai');
    },

    _aiUseItem(idx){
        const s = this.state;
        const type = s.ai.items[idx];
        if(!type){ this._fire('ai','player'); return; }

        ItemSystem.removeAt(s.ai.items, idx);
        const res = ItemSystem.apply(type, s, 'ai');
        UI.log(res.msg,'log-ai');

        if(type===ItemTypes.CIGARETTE && res.ok){ UI.flashHeal('ai'); UI.updateHP('ai',s.ai.hp,s.roundMaxHp); }
        if(type===ItemTypes.ENERGY_DRINK && res.ok) UI.updateChamber(s.chamber, s.chamberTotal);

        this._refreshStatuses();
        UI.notify(res.msg,2000);

        setTimeout(()=>{ if(s.turn==='ai') this._aiTurn(); },1100);
    },

    /* ==========================
       DISPARO
       ========================== */
    _fire(shooter, target){
        const s = this.state;

        // câmara vazia?
        if(s.chamber.length===0){
            s.seqIdx++;
            this._giveItems();
            this._loadChamber();
            s.busy=false;
            this._startTurn();
            return;
        }

        const shell  = s.chamber.shift();
        const sName  = shooter==='player'?'Você':'Dealer';
        const tName  = (shooter===target)? 'si mesmo' : (target==='player'?'Você':'Dealer');
        const isRed  = shell==='red';
        const icon   = isRed?'🔴':'🔵';

        // limpar conhecimento
        s[shooter].knownNext = null;
        UI.hideReveal();
        UI.fireDevice();

        UI.log(`${sName} atirou em ${tName}… ${icon} ${isRed?'VERMELHO':'AZUL'}!`, shooter==='player'?'log-player':'log-ai');
        UI.updateChamber(s.chamber, s.chamberTotal);

        if(isRed){
            let dmg = 1;
            if(s[shooter].sawActive){ dmg=2; s[shooter].sawActive=false; UI.log(`🔪 Serra! Dano: ${dmg}`,'log-dmg'); }

            s[target].hp = Math.max(0, s[target].hp - dmg);
            UI.flashDamage(target);
            UI.updateHP(target, s[target].hp, s.roundMaxHp);

            const hName = target==='player'?'Você':'Dealer';
            UI.log(`💥 ${hName} −${dmg} HP (${s[target].hp}/${s.roundMaxHp})`,'log-dmg');

            if(s[target].hp<=0){
                setTimeout(()=>this._endRound(),1000);
                return;
            }

            // turno passa para o outro
            setTimeout(()=>{
                s.turn = shooter==='player'?'ai':'player';
                s.busy = false;
                this._startTurn();
            },1100);

        } else {
            // azul
            if(shooter===target){
                // atirou em si → joga de novo
                UI.log(`${sName} mantém a vez!`,'log-info');
                UI.notify(`${icon} Azul! ${sName} joga novamente.`,1500);
                setTimeout(()=>{
                    s.busy=false;
                    this._startTurn();
                },950);
            } else {
                // atirou no oponente → azar, turno encerra
                UI.log('Sem efeito. Turno encerrado.','log-info');
                setTimeout(()=>{
                    s.turn = shooter==='player'?'ai':'player';
                    s.busy=false;
                    this._startTurn();
                },1100);
            }
        }
    },

    /* ==========================
       FIM DE RODADA
       ========================== */
    _endRound(){
        const s = this.state;
        let winner;
        if(s.player.hp<=0){ winner='ai';     s.aWins++; UI.log(`☠ Você caiu na Rodada ${s.round}.`,'log-dmg'); }
        else               { winner='player'; s.pWins++; UI.log(`🏆 Rodada ${s.round} vencida!`,'log-player'); }

        // === ZERAR ITENS DE AMBOS AO FIM DA RODADA ===
        s.player.items = [];
        s.ai.items     = [];
        s.player.sawActive = false;
        s.ai.sawActive     = false;
        s.player.cuffed    = false;
        s.ai.cuffed        = false;
        s.player.knownNext = null;
        s.ai.knownNext     = null;

        // Limpa visual dos itens
        UI.clearItems();
        UI.setStatus('player','');
        UI.setStatus('ai','');
        UI.hideReveal();

        UI.log('Itens descartados. Nova rodada com inventário limpo.','log-sys');

        if(s.round>=3){
            setTimeout(()=>this._endGame(),1400);
        } else {
            setTimeout(()=>UI.showRoundEnd(winner, s.round, s.pWins, s.aWins),1400);
        }
    },

    nextRound(){
        const next = this.state.round+1;
        if(next>3) this._endGame();
        else       this.startRound(next);
    },

    /* ==========================
       FIM DE JOGO
       ========================== */
    _endGame(){
        const s=this.state;
        let w;
        if(s.pWins>s.aWins)      w='player';
        else if(s.aWins>s.pWins) w='ai';
        else                     w='draw';
        UI.showGameOver(w, s.pWins, s.aWins);
    }
};

/* ---- Iniciar ---- */
document.addEventListener('DOMContentLoaded',()=>Game.init());
