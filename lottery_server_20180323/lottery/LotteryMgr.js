const   LotterySite = require('./LotterySite.js');
let    config      = require('../config/gameConfig.js').gameType;

class LotteryMgr{
    constructor(){
        this.sourceList = []
        let source;
        for(let code in config){
            source = new LotterySite(code);
            this.sourceList[code] = source;
        }
        console.log(`LotteryMgr-sourceList ==>>`)
        this.lotteryTimer = setInterval(
            ()=>{
                this.intervalRequestLottery().then( () =>{
                    console.log(` LotteryMgr-lotteryTimer ==>> suc`)
                }).catch( (err)=>{
                    console.log(` LotteryMgr-lotteryTimer err: ${err}`);
                })
            },1000);
    }
    
    intervalRequestLottery(){
        return new Promise((resolve, reject) => {
             let source;
            let that = this;
            console.log(`LotteryMgr-intervalRequestLottery ==>>`)           
            for (let code in that.sourceList) {
                source = that.sourceList[code];
                if (source) {
                    source.requestNextLottery();
                }
            }
            resolve(1);
        });
       
    }
    /**
     * 获取彩源历史记录
     * @param {string} code 
     */
    getHistoryLottery(code){
        return this.sourceList[code].getLotteryList();
    }
    /**
     * 获取彩源当期数据
     * @param {string} code 彩源
     */
    getLotteryInfo(code){
        return this.sourceList[code].lotteryInfo;
    }

    isEnd(code){
        return this.sourceList[code].isBetEnd();
    }

    getLotteryIssue(code){
        return this.sourceList[code].lotteryInfo.nowIssue;
    }
}

module.exports = LotteryMgr;