/* ==============================================
   R O U L E T T E  —  ITEM SYSTEM
   ============================================== */

const ItemTypes = {
    SAW:          'saw',
    CIGARETTE:    'cigarette',
    MAGNIFIER:    'magnifier',
    HANDCUFFS:    'handcuffs',
    ENERGY_DRINK: 'energy_drink'
};

const ItemData = {
    [ItemTypes.SAW]:          { name:'Serra',       icon:'🔪', desc:'Próximo tiro causa +1 dano extra' },
    [ItemTypes.CIGARETTE]:    { name:'Cigarro',     icon:'🚬', desc:'Recupera 1 HP' },
    [ItemTypes.MAGNIFIER]:    { name:'Lupa',        icon:'🔍', desc:'Revela o próximo cartucho' },
    [ItemTypes.HANDCUFFS]:    { name:'Algemas',     icon:'⛓️', desc:'Oponente perde o próximo turno' },
    [ItemTypes.ENERGY_DRINK]: { name:'Energético',  icon:'⚡', desc:'Remove o cartucho atual sem efeito' }
};

const ItemSystem = {

    /* ---- gerar itens aleatórios ---- */
    generateRandom(count){
        const pool = Object.values(ItemTypes);
        const out  = [];
        for(let i=0;i<count;i++) out.push(pool[Math.floor(Math.random()*pool.length)]);
        return out;
    },

    /* ---- aplicar item ---- */
    apply(itemType, state, user){
        const opp    = user==='player'?'ai':'player';
        const uData  = state[user];
        const oData  = state[opp];
        const info   = ItemData[itemType];
        const uName  = user==='player'?'Você':'Dealer';
        const oName  = opp==='player'?'Você':'Dealer';
        const res    = { ok:true, msg:'', log:'log-item', reveal:null, removed:null };

        switch(itemType){

            case ItemTypes.SAW:
                uData.sawActive = true;
                res.msg = `${uName} usou ${info.icon} ${info.name}! Próximo tiro causa dano dobrado.`;
                break;

            case ItemTypes.CIGARETTE:
                if(uData.hp < state.roundMaxHp){
                    uData.hp = Math.min(uData.hp+1, state.roundMaxHp);
                    res.msg = `${uName} usou ${info.icon} ${info.name}! +1 HP (${uData.hp}/${state.roundMaxHp})`;
                } else {
                    res.msg = `${uName} usou ${info.icon} ${info.name}! HP já está no máximo.`;
                }
                break;

            case ItemTypes.MAGNIFIER:
                if(state.chamber.length>0){
                    const next = state.chamber[0];
                    uData.knownNext = next;
                    const tag = next==='red'?'🔴 VERMELHO':'🔵 AZUL';
                    res.msg = `${uName} usou ${info.icon} ${info.name}! Próximo cartucho: ${tag}`;
                    res.reveal = next;
                } else {
                    res.msg = `${uName} usou ${info.icon} ${info.name}! Câmara vazia.`;
                    res.ok = false;
                }
                break;

            case ItemTypes.HANDCUFFS:
                oData.cuffed = true;
                res.msg = `${uName} usou ${info.icon} ${info.name}! ${oName} perderá o próximo turno.`;
                break;

            case ItemTypes.ENERGY_DRINK:
                if(state.chamber.length>0){
                    const rem = state.chamber.shift();
                    const tag = rem==='red'?'🔴 Vermelho':'🔵 Azul';
                    res.msg = `${uName} usou ${info.icon} ${info.name}! Cartucho ${tag} removido.`;
                    res.removed = rem;
                } else {
                    res.msg = `${uName} usou ${info.icon} ${info.name}! Câmara vazia.`;
                    res.ok = false;
                }
                break;

            default:
                res.ok  = false;
                res.msg = 'Item desconhecido.';
        }
        return res;
    },

    /* ---- remover do inventário ---- */
    removeAt(inv, idx){
        if(idx>=0 && idx<inv.length) return inv.splice(idx,1)[0];
        return null;
    },

    /* ---- dados visuais ---- */
    getData(type){
        return ItemData[type] || {name:'???',icon:'?',desc:'???'};
    }
};
