const config = require('../config/gameConfig.js');

let bet = {};
/**
 * 获取游戏数据
 * @param {number} gameType 游戏类型 
 * @returns {any}
 */
bet.getGameInfo =  (gameType) => {
    for (let item of config.gameList) {
        if (item.type == gameType) {
            return item;
        }
    }
    return null;
};
/**
 * 获取子游戏数据
 * @param {number} subType 子游戏类型 
 * @returns {any}
 */
bet.getSubGameInfo = (subType) => {
    for (let item of config.subgameList) {
        if (item.type == subType) {
            return item;
        }
    }
    return null;
};
/**
 * 获取子游戏的玩法数据
 * @param {number} noteType 玩法类型 
 * @returns {any}
 */
bet.getBetNoteInfo =  (noteType) =>{
    for (let item of config.betnoteList) {
        if (item.type == noteType) {
            return item;
        }
    }
    return null;
};
module.exports = bet;