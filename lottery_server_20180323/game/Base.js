var Tool = require('../util/Tools.js'),
    EventHandler = require('../event/event.js')
    clone = require('clone');
    MongooseClient = require('../mongodb/mongodb.js');

class BaseGame{
    constructor(code, gameType){
        this.bettingList = [];          // 真实的投注列表
        this.bettingListTimeSave = []; 
        this.bettingNo = 0;
        this.gameType = gameType;
        this.lotteryCode = code;
        this.gameId = code + gameType;
        this.betRankList = [];//本期投注榜
        this.bonusRankList = [];//本期中奖榜
        this.orderId = 0;
        this.orderExt = Math.floor(Date.now()*0.001).toString(36) + this.gameId;
        this.preBetItemList = {};
        this.preBetItemListTimeSave = {};
        this.betDate = Tool.DayDateNumber();
        this.betTimeStamp = Math.floor(Date.now()*0.001);
        shareData.eventHandler.emit(shareData.eventHandler.Inner.START_AUTOBET, {lotterycode:code, game:gameType});

        // 定时保存数据
        this.saveDataTime = 30*1000;            // 多少秒保存一次
        this.saveDataTimeDo = null;             // 定时器
        if(this.saveDataTimeDo){
            this.saveDataTimeDo = null;
        }
        // console.log(`=====  ======== =====`)
        // console.log(`=====  BaseGame =====`)
        // console.log(`=====  ======== =====`)
        // this.runSaveData().then(function(data){
        //     console.log(` runSaveData resolve: ${data}`)
        // }).catch( (error) =>{
        //     console.log(` runSaveData error: ${error}`)
        // }); 
        
    }  
    
    runSaveData(){
        return new Promise((resolve, reject) => {
            console.log(` runSaveData start :`)
            if(this.saveDataTimeDo){
                this.saveDataTimeDo = null;
            }
            this.saveDataTimeDo = setInterval(() =>{
                this.saveData().then( (data)=>{
                    console.log(` 定时器 saveDataTimeDo =>> ${data}`)

                } ).catch( (error)=>{
                    console.log(` 定时器 saveDataTimeDo error =>> ${error}`)
                } )
            },this.saveDataTime);
            resolve(1)
        });
       
    }

    saveData(){
        return new Promise((resolve, reject) => {
            console.log(` BaseGame ==>> saveData `)
            if(Object.keys(this.preBetItemListTimeSave).length >0 ){
                let preBetItemListTimeSave_new = clone(this.preBetItemListTimeSave)
                this.preBetItemListTimeSave = {};
                 MongooseClient.addPrePayOrder(preBetItemListTimeSave_new, (error, doc)=>{
                    if (error) {
                        reject(error)
                    }else{
                        preBetItemListTimeSave_new == {};
                        // shareData.eventHandler.emit(EventHandler.Inner.SUMBIT_BETITEM, {list:items, date:this.betTimeStamp});
                        resolve(doc)
                    }
                })
            }
        });
    }

    /*
        游戏退出，将所有数据保存到数据库中
    */
    exit(){
        return new Promise((resolve, reject) => {
            if(this.saveDataTimeDo){
                this.saveDataTimeDo = null;
            }
            this.saveData()
            // .then(()=>{
                resolve(1)
            // }).catch( (error) => { reject(error) } );
        });
    }

    initBettingList(issue) {
        // MongooseClient.findBetItemFromGame(this.lotteryCode, issue, this.gameType, (err, res)=>{
        //     if (err) {
        //         return;
        //     }
        //     if (res.length < 1) {
        //         return;
        //     }
        //     this.bettingList = res;
        //     this.bettingNo = res.length;
        // });
    }

    getBettingItem(orderId){
        for (let item of this.bettingList) {
            if (item.orderId == orderId) {
                return item;
            }
        }
        return null;
    }
    
    // 
    addPreBetItemList(items){
        return new Promise((resolve, reject) => {
            for (let item of items) {
                this.orderId ++;
                item.orderId = this.orderExt + this.orderId;
                this.preBetItemList[item.orderId] = item;
                this.preBetItemListTimeSave[item.orderId] = item;
            }
            // 返回帶有orderid的數據
            resolve(items)
        });
       
    }

    addRealBetItem(items){
        return new Promise((resolve, reject) => {
            console.log(`Base-addRealBetItem  ==>>`)
            let realItem = [];
            for (let orderId of items) {
                let item = this.preBetItemList[orderId];
                if (item) {
                    item.state = 2;
                    realItem.push(item);
                    this.bettingList.push(item);
                    delete this.preBetItemList[orderId];
                    delete this.preBetItemListTimeSave[orderId];
                }
            }
            if (null == this.betDate) {
                this.betDate = Tool.DayDateNumber();
            }
            resolve(1)
        });
        
        // MongooseClient.addRealPayOrder(realItem, this.betDate);
    }

    updateBetRank(beter, bonus){
        return new Promise((resolve, reject) => {
            //清空上一期的投注榜数据
            this.betRankList = [];
            if (Object.keys(beter).length < 1) {
                return;
            }
            //统计投注榜
            for (let pId in beter) {
                if (beter.hasOwnProperty(pId)) {
                    let element = beter[pId];
                    this.betRankList.push({playerId:pId, money:beter[pId]});
                }
            }
            //投注榜排序
            this.betRankList.sort((a,b) => {
                if (a.money > b.money) {
                    return -1;
                } else if (a.money < b.money) {
                    return 1;
                }
                return 0;
            });
            shareData.eventHandler.emit(shareData.eventHandler.Inner.BROADCAST_BETRANK, {gounpId:this.gameId, list:this.getBetRankList()});
            resolve(bonus);
        });
        
    }

    updateBonusRank(winner){  
        return new Promise((resolve, reject) => {
            this.bonusRankList = [];
            if (Object.keys(winner).length < 1) {
                reject(1)
                return;
            }
            let money = 0;
            for (let pId in winner) {
                if (winner.hasOwnProperty(pId)) {
                    money = winner[pId] * 0.001;   
                    this.bonusRankList.push({playerId:pId, bonus:money});   
                }
            }
            if (this.bonusRankList.length > 1) {
                this.bonusRankList.sort((a, b) => {
                    if (a.bonus > b.bonus) {
                        return -1;
                    } 
                    if (a.bonus < b.bonus) {
                        return 1;
                    }
                    return 0;
                });
            }   
            resolve(1);
            shareData.eventHandler.emit(shareData.eventHandler.Inner.BROADCAST_BONUSRANK, {gounpId:this.gameId, list:this.getBonusRankList()});
        });
    }

    getBettingList(){
        return this.bettingList;
    }

    getBetRankList(){
        if (this.betRankList.length < 3) {
            return this.betRankList;
        }
        // console.log(`彩源--${this.lotteryCode}游戏--${this.gameType}投注排行榜`);
        let topRank = this.betRankList.slice(0,3);
        // console.log(topRank);
        return topRank;
    }

    getBonusRankList(){
        if (this.bonusRankList.length < 3) {
            return this.bonusRankList;
        }
        // console.log(`彩源--${this.lotteryCode}游戏--${this.gameType}中奖排行榜`);
        let topRank = [];
        topRank = this.bonusRankList.slice(0,3);
        // console.log(topRank);
        return topRank;
    }
    /**
     * 发放奖金
     * @param {string} strCode 开奖号码:"1,2,3,4,5"
     * @param {number[]} numCode 开奖号码数组:[1,2,3,4,5] 
     * @param {string} issue 开奖期
     */
    giveBonus(strCode, numCode, issue){
        console.log(` giveBonus ==>> strCode:${strCode},numCode:${numCode}`)
        let length = this.bettingList.length;
        if (length < 1) {
            return;
        }
        console.log(` giveBonus ==>> length:${length}`)
        let lotteryResult = this.getLotteryResult(numCode);
        let updateList = [];            // 需要更新的列表
        let winnerList = [];            // 赢家的列表
        let pId_bonus = {};             // 汇总玩家的中奖金额
        let pId_bonusList = [];         // 汇总玩家的中奖金额
        let pId_betMoney = {};          // 汇总玩家的投注金额
        for (let item of this.bettingList) {
            item.number = strCode;  
            item.state = this.isBetWinning(item.betType, lotteryResult) ? 4 : 3;     
            if (item.state == 4) {
                winnerList.push(item);
                if (null == pId_bonus[item.playerId]) {
                    pId_bonus[item.playerId] = 0;
                }
                pId_bonus[item.playerId] += item.betMoney*item.betGain;  
            }
            if (null == pId_betMoney[item.playerId]) {
                pId_betMoney[item.playerId] = 0;
            }
            pId_betMoney[item.playerId] += item.betMoney;
            updateList.push(item);
        }
        pId_bonusList  = Tool.ObjectToArray(pId_bonus)

        //清空本期投注记录
        this.bettingList = [];
        this.bettingNo = 0;
        this.preBetItemList = {};
        //更新玩家投注订单的状态
        if (winnerList.length > 0) {
            console.log(`giveBonus ==>> 中奖人数: ${winnerList.length}`)
            MongooseClient.updateRealPayOrder(updateList, this.betDate);
            let betTimeStamp = this.betTimeStamp;
            let lotteryCode = this.lotteryCode;
            // 保存数据并发送给服务中心
            MongooseClient.addPreBonusOrder(winnerList,betTimeStamp)
                .then(()=>{
                    return MongooseClient.updateLotteryWinRecord(issue,lotteryCode,pId_bonusList)
                }).then( () =>{
                    return this.updateBetRank(pId_betMoney,pId_bonus)
                }).then( ()=> this.updateBonusRank() ).then( (data)=>{
                    console.log(` giveBonus  ===>>> 发送消息给服务中心`)
                    shareData.eventHandler.emit(shareData.eventHandler.Inner.ADD_WINNING_BETITEM, {list:winnerList, date:betTimeStamp});
                    //广播中奖信息
                    shareData.eventHandler.emit(shareData.eventHandler.Inner.BROADCAST_WININFO, {code:lotteryCode, win:pId_bonus});

                }).catch(( error)=>{
                    console.log(`base-giveBonus ===>>> error:${error}`)
                })
        }else{
            console.log(`giveBonus ==>> 本期没有中奖`)
            this.updateBetRank(pId_betMoney,pId_bonus).then(this.updateBonusRank).then( (data)=>{
                console.log("更新成功",data)
            } ).catch( (err)=>{
                console.log("异常~",err)
            } )
        }         
        
        // this.updateBetRank(pId_betMoney);
        // this.updateBonusRank(pId_bonus);
    }
    /**
     * 开始新一期投注，执行开奖和自动挂机操作
     * @param {any} data 上一期开奖号码和本期期号
     * @param {string} data.code 上一期开奖号码
     * @param {string} data.issue 本期期号
     */
    autoBetting(issue) {
        return new Promise((resolve, reject) => {
            this.betDate = Tool.DayDateNumber();
            this.betTimeStamp = Math.floor(Date.now()*0.001);
            MongooseClient.findAutoBetFromGame(this.lotteryCode, this.gameType, (err, res)=>{
                if (err) {
                    reject(1);
                    return;
                }
                let length = res.length;
                if (length < 1) {
                    resolve(1);
                    return;
                }
                //挂机时,如果资金不足，本期挂机作废，同时取消挂机状态
                let issue = data.issue;
                let code = this.lotteryCode;
                let timestamp = Math.floor(Date.now()*0.001);
                let item, pId;
                let itemlist = [];
                //判断投注信息的数据是否合法
                for (let index = 0; index < length; index++) {
                    item = res[index];
                    pId = item.playerId;
                    this.orderId ++;
                    item.orderId = this.orderExt + this.orderId;
                    item.issueId = issue;
                    item.lotteryCode = code;
                    item.timestamp = timestamp;   
                    item.betGain = Bet.getBetNoteInfo(item.betType).gain;
                    itemlist.push(item);
                    this.preBetItemList[item.orderId] = item;
                }
                  
                if (itemlist.length > 0) {
                    MongooseClient.addPrePayOrder(itemlist, (error, doc)=>{
                        if (error) {
                            console.error('add pre pay order failed', error);
                            reject(error);
                            return;
                        }
                        shareData.eventHandler.emit(shareData.eventHandler.Inner.SUMBIT_BETITEM, {list:itemlist, date:this.betTimeStamp});
                        resolve(1)
                    });
                }
            });
        });
        
    }

    broadcastBetting(){
        let length = this.bettingList.length;
        if (length > this.bettingNo) {
            shareData.eventHandler.emit( shareData.eventHandler.Inner.BROADCAST_BET, {gounpId:this.gameId, list:this.bettingList.slice(this.bettingNo)});
            this.bettingNo = length;
        }
    }

    /**
     * 获取开奖号码对应的投注类型,由子类实现
     * @param {number[]} code 开奖号码
     */
    getLotteryResult(code){

    }
    /**
     * 投注类型是否中奖,由子类实现
     * @param {number} betType 投注类型
     * @param {number[]} result 开奖结果组
     * @returns {boolean} 是否中奖
     */
    isBetWinning(betType, result){
        
    }

   
}

module.exports = BaseGame;