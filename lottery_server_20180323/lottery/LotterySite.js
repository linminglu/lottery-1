let EventHandler =  require('../event/event.js'),
    RealSource = require('./RealSource.js'),
    LotteryTool = require('./LotteryTool.js');
    // MongooseClient = require('../dao/mongo_command.js');


class LotterySite{
   
    /**
     * 初始化彩源
     * @param {string} code 彩源编号
     */
    constructor(code){
        this.source = code;
        this.lotteryList = [];
        this.lotteryInfo = {
            endTime:0,
            lastIssue:'',
            nowIssue:''
        };
        this.hasInitLottery = false;
        this.startHandler(code);
        this.lotterySource = new RealSource(code);        
    }

     startHandler(code){
        console.log(`LotterySite_startHandler ==>> ${code}`)
        shareData.eventHandler.on(EVENTNAME.inner_event_lotterylist_ + code, (data) => {
            console.log(`LotterySite-startHandler-inner_event_lotterylist_${code} ==>>`)
            this.initLotteryHistory(data)
        });
        shareData.eventHandler.on(EVENTNAME.inner_event_new_lottery_ + code, (data) => {
            console.log(`LotterySite-startHandler-inner_event_new_lottery_${code}  ==>>`)
            this.updateLotteryHistory(data)
        });
    }

    updateLotteryInfo(){
        console.log("LotterySite-updateLotteryInfo ==>> ")
        // console.dir(this.lotteryInfo)
        // console.dir(this.lotteryList)
        let data = this.lotteryList[0];
        this.lotteryInfo.lastIssue = data.issue;
        this.lotteryInfo.nowIssue = LotteryTool.getNextIssue(data);
        this.lotteryInfo.endTime = LotteryTool.getNowIssueEndTime(data);
        // console.dir(this.lotteryInfo)
        // console.dir(shareData.MongooseClient.LotteryRecordModel)
        shareData.MongooseClient.LotteryRecordModel.addLotteryIssueRecord(this.source, this.lotteryInfo.nowIssue);
    }

    updateLotteryCode(data){
        return new Promise((resolve, reject) => {
            console.log("LotterySite-updateLotteryCode ==>> ");
            shareData.MongooseClient.LotteryRecordModel.updateLotteryCode(data.issue, data.code, data.opendate).then( (data)=>{
                resolve(data)
            } ).catch( (err)=>{
                reject(err)
            } )
        });
    }

    initLotteryHistory(data){
        console.log(`LotterySite-initLotteryHistory ===>>>`)
        this.lotteryList = data;
        this.updateLotteryInfo();
        this.hasInitLottery = true;
    }

    updateLotteryHistory(data){
        console.log(`LotterySite-updateLotteryHistory ===>>> `)
        // console.dir(data)
        if (data.issue != this.lotteryInfo.nowIssue) {
            console.error('LotterySite-updateLotteryHistory', data);
            return;
        }
        this.lotteryList.unshift(data); 
        if (this.lotteryList.length > 30) {
            this.lotteryList.pop();
        }
        this.updateLotteryCode(data).then( ()=>{
            console.log(`loterySite-updateLotteryHistory ===>>> suc`)
            this.sendUpdateLotteryHistoryMsg(data)
        } ).catch( (err)=>{
            console.log(`loterySite-updateLotteryHistory error: ${err}`)
            this.sendUpdateLotteryHistoryMsg(data)
        });
        
    }

    sendUpdateLotteryHistoryMsg(data){
        // updateLotteryInfo.apply(this);
        shareData.eventHandler.emit(EVENTNAME.inner_event_lotteryhistory_update, 
            {code:data.code, lotterycode:data.lotterycode, issue:this.lotteryInfo.nowIssue});
        shareData.eventHandler.emit(EVENTNAME.inner_event_new_lottery, data);
    }


    requestNextLottery() {
        console.log(`lotterySite-requestNextLottery`)
        // console.log(`this.lotterySource ==>>`)
        // console.dir(this.lotterySource)
        // console.log(`this.hasInitLottery ==>>`)
        // console.dir(this.hasInitLottery)
        if (this.lotterySource && this.hasInitLottery) {
            this.lotterySource.requestNextLottery({issue:this.lotteryInfo.nowIssue, code:this.source});
        }  
    }

    getLotteryList(){
        return this.lotteryList;
    }

    isBetEnd(){
        // console.log(`isBetEnd endTime:${this.lotteryInfo.endTime} ,now:${Date.now()}`)
        return this.lotteryInfo.endTime < Date.now();
    }
}

module.exports = LotterySite;