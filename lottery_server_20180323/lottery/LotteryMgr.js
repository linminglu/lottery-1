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
        console.dir(this.sourceList)
        // let configGameType = [...config]
        // configGameType.forEach(code => {
            
        // });
        this.lotteryTimer = setInterval(this.intervalRequestLottery,1000);
    }
    
    intervalRequestLottery(){
        console.log(`LotteryMgr-intervalRequestLottery ==>>`)
        
        let source;
        for (let code in this.sourceList) {
            console.log(`code :${code}`)
            // if (this.sourceList.hasOwnProperty(code)) {
                source = this.sourceList[code];
                console.dir(source)
                if (source) {
                    source.requestNextLottery();
                }
            // }
        }
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