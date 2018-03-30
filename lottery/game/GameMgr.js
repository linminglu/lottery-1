const Niuniu = require('./Niuniu.js'),
    Baccarat = require('./Baccarat.js'),
    LongHuPK = require('./LongHuBattle.js'),
    NiuniuPK = require('./NiuniuBattle.js'),
    HongHeiPK = require('./HongHeiBattle.js'),
    Tool = require('../util/Tools.js'),
    GameConfig = require('../config/gameConfig.js');

/**
 * 平台管理器
 */
class GameMgr{
    constructor(){
        GameMgr.gameGroup = {'CQSSC':{},'TXFFC':{},'BJPK10':{}};//游戏列表
        GameMgr.gameTypeList = {NIUNIU:Niuniu, BACCARAT:Baccarat, LONGHU:LongHuPK, PK_NIUNIU:NiuniuPK, PK_HONGHEI:HongHeiPK};
        GameMgr.config = [{code:'CQSSC',
                                game:[GameMgr.gameTypeList.NIUNIU, 
                                        GameMgr.gameTypeList.BACCARAT, 
                                        GameMgr.gameTypeList.LONGHU, 
                                        GameMgr.gameTypeList.PK_HONGHEI]},
                            {code:'TXFFC',
                                         game:[GameMgr.gameTypeList.NIUNIU,
                                              GameMgr.gameTypeList.BACCARAT, 
                                              GameMgr.gameTypeList.LONGHU, 
                                              GameMgr.gameTypeList.PK_HONGHEI]},
                            {code:'BJPK10', 
                                        game:[GameMgr.gameTypeList.PK_NIUNIU]}];

        this.autoBetTime = GameConfig.autoBetTime;   // 自动定时下注器

        let game;
        for (let item of GameMgr.config) {
            for (let gameClass of item.game) {
                game = new gameClass(item.code);
                GameMgr.gameGroup[item.code][game.gameType] = game;
            }
        }
        this.broadcastTimer = setInterval(function(){
            let games;
            let game;
            for (let key in GameMgr.gameGroup) {
                if (GameMgr.gameGroup.hasOwnProperty(key)) {
                    games = GameMgr.gameGroup[key];
                    for (let key in games) {
                        if (games.hasOwnProperty(key)) {
                            game = games[key];
                            game.broadcastBetting();
                        }
                    }
                }
            }
        }, 10000);
    }
   /**
     * 定时广播游戏内的新增投注
     */
    static broadcastAllGame() {
        let games;
        let game;
        for (let key in GameMgr.gameGroup) {
            if (GameMgr.gameGroup.hasOwnProperty(key)) {
                games = GameMgr.gameGroup[key];
                for (let key in games) {
                    if (games.hasOwnProperty(key)) {
                        game = games[key];
                        game.broadcastBetting();
                    }
                }
            }
        }
    }

    /**
     * 获取玩家所在的游戏信息
     * @param {any} player 玩家信息
     */
    getGameByPlayer(player){
        if (!player) {
            return null;
        }
        let games = GameMgr.gameGroup[player.lotteryCode];
        if (null == games) {
            return null;
        }
        return games[player.gameType];
    }
    /**
     * 新的彩票数据
     * @param {Object} data 最新的彩票数据
     * @param {string} data.lotterycode 彩源
     * @param {string} data.code 开奖号码
     * @param {string} data.issue 期号
     */
    eventNewLottery(data){
        console.log(` GameMgr-eventNewLottery ===>>>`)
        // console.dir(data)
        let nums = Tool.stringToIntArray(data.code);
        let games = GameMgr.gameGroup[data.lotterycode];
        let game;
        for (let key in games) {
            if (games.hasOwnProperty(key)) {
                game = games[key];
                // 发放奖金
                game.giveBonus(data.code, nums, data.issue);
                // 自动投注
                game.autoBetting(data.issue).then( ()=>{
                    console.log(` GameMgr-eventNewLottery-autoBetting  ===>>> suc`)
                }).catch( (error) =>{
                     console.log(` GameMgr-eventNewLottery-autoBetting error: ${error}`)
                });
            }
        }
    }
    /**
     * 历史彩票数据
     * @param {any} data 最新的彩票数据
     */
    eventHistoryLottery(data){
         console.log(` GameMgr-eventHistoryLottery ==>>`)
        let games = GameMgr.gameGroup[data.lotterycode];
        let game;
        for (let key of games) {
            if (games.hasOwnProperty(key)) {
                game = games[key];
                game.initBettingList(data.issue);
            }
        }
    }

    /**
     * 新增投注数据
     * @param {any[]} items 
     * @param {string} lotteryCode 
     * @param {number} gameType 
     */
    addPreBetItem(items, lotteryCode, gameType, AutoBet){
        return new Promise((resolve, reject) => {
            console.log(`GameMgr-addPreBetItem ==>>   
                            新增投注数据：lotteryCode:${lotteryCode}
                            ,游戏类型：${gameType} 新增数量:${items.length} `);
            if (items.length == 0) {
                resolve(1)
            }else{
                let games = GameMgr.gameGroup[lotteryCode];
                if (games) {
                    games[gameType].addPreBetItemList(items,AutoBet).then(
                        (items) => {
                        // 保存到数据库
                        return shareData.mongooseClient.addPrePayOrder(items)
                        // resolve(items);
                    }).then( ()=>{
                         resolve(items);
                    }).catch(function(error){
                        reject(error)
                    });
                }else{
                    resolve(1)
                }      
            } 
        });        
    }

    /**
     * 保存投注记录
     * @param {any[]} items
     */
    addRealBetList(items){
        console.log(` GameMgr-addRealBetList ==>> `)
        if (items.length == 0) {
            return;
        }
        const game_items = {};
        for (const item of items) {
            var games = GameMgr.gameGroup[item.lotteryCode];
            if (games) {
                if (null == game_items[item.gameType]) {
                    game_items[item.gameType] = [];
                }
                game_items[item.gameType].push(item.order);
            }
        } 
        for (const gameType in game_items) {
            if (game_items.hasOwnProperty(gameType)) {
                const items = game_items[gameType];
                if (games[gameType] && items) {
                    games[gameType].addRealBetItem(items);
                }   
            }
        }
    }

    getBetItem(item){  
        let games = GameMgr.gameGroup[item.lotteryCode];
        if (null == games) {
            return null;
        }
        let game = games[item.gameType];
        if (null == game) {
            return null;
        }
        return game.getBettingItem(item.order);   
    }
}

module.exports = GameMgr;