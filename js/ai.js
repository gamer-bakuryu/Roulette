/* ==============================================
   R O U L E T T E  —  AI SYSTEM
   ============================================== */

const AI = {

    /* ---- decisão principal ---- */
    decide(state){
        const ai      = state.ai;
        const player  = state.player;
        const ch      = state.chamber;
        const total   = ch.length;

        if(total===0) return {action:'shoot_player'};

        const reds  = ch.filter(s=>s==='red').length;
        const blues = total - reds;
        const pRed  = reds/total;

        /* --- se sabe o próximo cartucho --- */
        if(ai.knownNext){
            const itemAct = this._itemsKnown(state, ai.knownNext);
            if(itemAct) return itemAct;

            if(ai.knownNext==='red'){
                // usar serra se tiver
                if(!ai.sawActive){
                    const si = ai.items.indexOf(ItemTypes.SAW);
                    if(si!==-1) return {action:'use_item',idx:si};
                }
                // algemas
                if(!player.cuffed){
                    const ci = ai.items.indexOf(ItemTypes.HANDCUFFS);
                    if(ci!==-1) return {action:'use_item',idx:ci};
                }
                return {action:'shoot_player'};
            } else {
                return {action:'shoot_self'};
            }
        }

        /* --- considerar itens --- */
        const itemAct = this._considerItems(state, pRed);
        if(itemAct) return itemAct;

        /* --- sem conhecimento: probabilidade --- */
        if(total===1){
            return reds===1 ? {action:'shoot_player'} : {action:'shoot_self'};
        }

        if(pRed<=0.3)  return {action:'shoot_self'};
        if(pRed>=0.6)  return {action:'shoot_player'};

        if(ai.hp<=1)     return {action:'shoot_player'};
        if(player.hp<=1 && pRed>=0.4) return {action:'shoot_player'};

        return Math.random()<pRed ? {action:'shoot_player'} : {action:'shoot_self'};
    },

    /* ---- considerar itens (sem conhecimento) ---- */
    _considerItems(state, pRed){
        const ai    = state.ai;
        const items = ai.items;
        if(!items.length) return null;

        // lupa
        if(!ai.knownNext && state.chamber.length>0){
            const i = items.indexOf(ItemTypes.MAGNIFIER);
            if(i!==-1) return {action:'use_item',idx:i};
        }
        // cigarro se HP baixo
        if(ai.hp <= Math.ceil(state.roundMaxHp/2) && ai.hp<state.roundMaxHp){
            const i = items.indexOf(ItemTypes.CIGARETTE);
            if(i!==-1) return {action:'use_item',idx:i};
        }
        // serra se muitos vermelhos
        if(pRed>=0.5 && !ai.sawActive){
            const i = items.indexOf(ItemTypes.SAW);
            if(i!==-1) return {action:'use_item',idx:i};
        }
        // algemas
        if(!state.player.cuffed && pRed>=0.5){
            const i = items.indexOf(ItemTypes.HANDCUFFS);
            if(i!==-1) return {action:'use_item',idx:i};
        }
        // energético se desesperado
        if(ai.hp<=1 && state.chamber.length<=2){
            const i = items.indexOf(ItemTypes.ENERGY_DRINK);
            if(i!==-1) return {action:'use_item',idx:i};
        }
        return null;
    },

    /* ---- itens quando sabe o próximo ---- */
    _itemsKnown(state, shell){
        const ai    = state.ai;
        const items = ai.items;
        if(!items.length) return null;

        if(shell==='red'){
            if(!ai.sawActive){
                const i = items.indexOf(ItemTypes.SAW);
                if(i!==-1) return {action:'use_item',idx:i};
            }
            if(!state.player.cuffed){
                const i = items.indexOf(ItemTypes.HANDCUFFS);
                if(i!==-1) return {action:'use_item',idx:i};
            }
        } else {
            if(ai.hp<=Math.ceil(state.roundMaxHp/2) && ai.hp<state.roundMaxHp){
                const i = items.indexOf(ItemTypes.CIGARETTE);
                if(i!==-1) return {action:'use_item',idx:i};
            }
        }
        return null;
    }
};
