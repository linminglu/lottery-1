let mongoose = require('mongoose'),
    Tools = require('../util/Tools.js'),
    bluebird = require('bluebird'),
 	server_config = require('../config/serverConfig.js'),
 	fs = require('fs');

const COLLECTIONSNAME = server_config.mongoDB.selfCollectionsName;

let DB_URL = `mongodb://${server_config.mongoDB.host}:${server_config.mongoDB.port}/${server_config.mysqlDb.database}`;
const Schema = mongoose.Schema;
const db = mongoose.connection;
let hasOpened = false;
let nowDate = Tools.DayDateNumber().toString();
console.log(`nowDate=${nowDate}`)
console.log(`${typeof nowDate}`)
const payOrderSchema = new Schema({
    orderId:String,
    playerId:String,
    playerType:Number,
    issueId:String,
    gameType:Number,
    betType:Number,
    moneyType:Number,
    betMoney:Number,
    betGain:Number,  
    lotteryCode:String,
    timestamp:Number,
    sendStatus:{type:Number, default:0},
    state:{type:Number, default:1},
    number:{type:String, default:''}
});

// 预投支付订单
let PrePayOrder = mongoose.model(COLLECTIONSNAME.PrePayOrder, payOrderSchema);

// 真的支付订单
let RealPayOrder = mongoose.model(nowDate+COLLECTIONSNAME._RealPayOrder, payOrderSchema);

const bonusOrderSchema = new Schema({
    orderId:String,
    playerId:String,
    moneyType:Number,
    bonus:Number,
    betType:Number,
    betTimeStamp:Number,
    sendStatus:{type:Number, default:0},
});
let PreBonusOrder = mongoose.model( COLLECTIONSNAME.PreBonusOrder, bonusOrderSchema);
let RealBonusOrder = mongoose.model(nowDate+COLLECTIONSNAME._RealBonusOrder, bonusOrderSchema);

const lotteryRecordSchema = new Schema({
    lotteryCode:String,//彩源代码
    issue:String,//期号
    date:String,//日期
    winList:Array,//赢的数据
    code:{type:String, default:0},  // 
    opendate:{type:String, default:0},// 开奖时间
    // winPlay
    sendStatus:{type:Number, default:0},
});
let LotteryRecordModel = mongoose.model( COLLECTIONSNAME.LotteryRecord, lotteryRecordSchema);

const autoBetOrderSchema = new Schema({
    playerId:String,
    gameType:Number,
    betType:Number,
    betMoney:Number,
    lotteryCode:String,
    sendStatus:{type:Number, default:0},
});
let AutoBetOrderModel = mongoose.model( COLLECTIONSNAME.AutoBetOrderRecord, autoBetOrderSchema);

const sumbitOrderSchema = new Schema({
    orderType:Number,
    orderCount:Number,
    orderList:Array,
    sendStatus:{type:Number, default:0},
},{
    timestamps:true
});
let SumbitOrderModel = mongoose.model(nowDate+COLLECTIONSNAME._SumbitOrderRecord, sumbitOrderSchema);

const receiveOrderSchema = new Schema({
    errorCount:Number,
    successCount:Number,
    errorList:Array,
    successList:Array,
    sendStatus:{type:Number, default:1},
},{
    timestamps:true
});
let ReceiveOrderModel = mongoose.model(nowDate+COLLECTIONSNAME._ReceiveOrderRecord, receiveOrderSchema);
//保存每种游戏接受投注的最新期号
const gameIssueRecordSchema = new Schema({
    lotteryCode:String,
    issueId:String,
    gameType:Number,
    sendStatus:{type:Number, default:0},
});
let GameIssueRecordModel = mongoose.model(COLLECTIONSNAME.GameIssueRecord, gameIssueRecordSchema);



module.exports = {
	// promise 的方法改写连接数据后获取token的回掉
    MongodbInit(){
        return new Promise((resolve, reject)=>{

            mongoose.connect(DB_URL);

            mongoose.Promise = bluebird;
            
            mongoose.connection.on('error', function (err) {
                console.log('Mongoose connection error: ' + err); 
            });
            mongoose.connection.on('connected', function () {
                console.log('Mongoose connected ' + DB_URL); 
                resolve();
            });
            mongoose.connection.on('connecting', function () {
                console.log('Mongoose connecting'); 
            });
            mongoose.connection.on('disconnected', function () {
                console.log('Mongoose disconnected'); 
                hasOpened = false;
            });
            mongoose.connection.on('close', function () {
                console.log('Mongoose close'); 
                hasOpened = false;
            });
            mongoose.connection.once('open', function (args) {
                console.log('Mongoose open');
                hasOpened = true;
            });
        })
    },


	// 获取未完成的数据 预先中奖
	getNoSendData_preBonusOrder(){
		return new Promise((resolve, reject) => {
            console.log(`正在获取未完成的数据`)
            PreBonusOrder.find({sendStatus:0},function(err, data){
                if(err){
                    reject(err)
                }else{
                    resolve(data)
                }
            })
		});		
	},

    // 更新
    updateSendData_preBonusOrder(date){
        return new Promise((resolve, reject) => {
            console.log(`正在更新的已发送的数据 => updateSendData_preBonusOrder date:${date}`);
            if(date){
                PreBonusOrder.update({betTimeStamp:date},{$set:{sendStatus:1}},(err, res)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(res);
                    }
                })
            }else{
                resolve(1);   
            }     
        });     
    },
	 /**
     * 保存预投注订单
     * @param {any[]} orderObj 订单列表
     * @param {function} callback 回调函数
     */
    addPrePayOrder(orderObj, callback){
        return new Promise((resolve, reject) => {
            console.log(`保存预投注订单：`)
            if (!hasOpened) {
                reject(1)
                return;
            }
            PrePayOrder.insertMany(Object.values(orderObj), (error, doc)=>{
                if (error) {
                    console.error('pre pay order failed', error);
                    reject(2)
                }else{
                    resolve(doc);
                } 
            });
        });

    },
    /**
     * 删除预投注订单
     * @param {string[]} orderObj 订单列表
     */
    delPrePayOrder (orderObj) {
        return new Promise((resolve, reject) => {
            console.log(`mongodb-delPrePayOrder ==>> `)
            if (!hasOpened) {
                reject(`mongoose hasOpened ${hasOpened}`);
                return;
            }else if (orderObj.length < 1) {
                // reject(`mongoose orderObj of length is <1 . ${orderObj}`);
                resolve()
                return;
            }
            PrePayOrder.deleteMany({orderId:{$in:orderObj}}, (err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                resolve()
            });
        });
        
    },

    /**
     * 服务器预投注订单
     * @param {string[]} sucOrderObj 成功订单列表
     * @param {string[]} errOrderObj 失败订单列表
     */
    confrimPrePayOrder (sucOrderObj, errOrderObj) {
        return new Promise((resolve, reject) => {
            console.log(`mongodb-confrimPrePayOrder ==>> `)
            if (!hasOpened) {
                reject(`mongoose hasOpened ${hasOpened}`);
                return;
            }else if (sucOrderObj.length < 1 && errOrderObj.length < 1) {
                // reject(`mongoose orderObj of length is <1 . ${orderObj}`);
                resolve(1)
                return;
            }else{
                resolve(1)
                return;
            }
            this.confrimSucPrePayOrder(sucOrderObj).then( this.confrimErrPrePayOrder(errOrderObj) ).then(
                ()=>{
                    resolve(1);
                }
            ).catch(
                (err) =>{
                    reject(err)
                }
            )
        });
    },

    confrimSucPrePayOrder(orderObj){
        return new Promise((resolve, reject) => {
            console.log(`mongodb-confrimSucPrePayOrder ==>>`)
            if(orderObj.length < 1){
                resolve(1)
                return;
            }
            PrePayOrder.update({orderId:{$in:orderObj}},{$set:{sendStatus:1,orderStatus:1}}, (err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                resolve()
            });
        });
    },

    confrimErrPrePayOrder(orderObj){
        return new Promise((resolve, reject) => {
            if(orderObj.length < 1){
                resolve(1)
                return;
            }
            PrePayOrder.update({orderId:{$in:orderObj}},{$set:{sendStatus:1,orderStatus:2}}, (err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                resolve()
            });
        });
    },
     /**
     * 保存有效投注订单
     * @param {any[]} orderObj 订单列表
     * @param {string} date 日期(格式：年月日)
     */
    addRealPayOrder(orderObj, date){
        return new Promise((resolve, reject) => {
            console.log(`保存有效投注订单:${orderObj}`)
            if (!hasOpened) {
                reject(1)
                return;
            }
            if (orderObj.length < 1) {
                reject(1)
                return;
            }
            if (null == date) {
                date = Tools.DayDateNumber();
            }
            if (date !== nowDate) {
                nowDate = date;
                RealPayOrder = mongoose.model(nowDate+COLLECTIONSNAME._RealPayOrder, payOrderSchema);
            }

            RealPayOrder.insertMany(orderObj, (error, doc)=>{
                if (error) {
                    console.error('real pay order insert failed', err);
                    reject(1)
                    return;
                }
                let orderList = [];
                for (let item of doc) {
                    orderList.push(item.orderId);
                }
                // 确认已经投了
                this.confrimPrePayOrder(orderList)
                // this.delPrePayOrder(orderList)
                .then( ()=>{
                    resolve();
                } ).catch( ()=>{
                    reject(1)
                } )
            });
        });
       
    },
     /**
     * 开奖后更新有效投注订单数据
     * @param {any[]} orderObj 订单列表
     * @param {string} date 日期(格式：年月日)
     */
    updateRealPayOrder (orderObj, date) {
        console.log(`开奖后更新有效投注订单数据:${orderObj}`)
        if (!hasOpened) {
            return;
        }
        if (orderObj.length < 1) {
            return;
        }
        let orderIdList = [];
        let numberList = {};
        let stateList = {};
        for (let order of orderObj) {
            orderIdList.push(order.orderId);
            numberList[order.orderId] = order.number;
            stateList[order.orderId] = order.state;
        }
        if (null == date) {
            date = Tools.DayDateNumber();
        }
        if (date !== nowDate) {
            nowDate = date;
            RealPayOrder = mongoose.model(nowDate+COLLECTIONSNAME._RealPayOrder, payOrderSchema);
        }
        RealPayOrder.find({orderId:{$in:orderIdList}}, (err, res)=>{
            if (err) {
                console.error(err);
                return;
            }
            res.forEach(item => {
                item.number = numberList[item.orderId];
                item.state = stateList[item.orderId];
                item.save();
            });
        });
    },

    /**
     * 保存预中奖订单数据
     * @param {any[]} orderObj 订单列表
     * @param {function} 
     */
    addPreBonusOrder(orderObj, betTimeStamp){
        return new Promise((resolve, reject) => {
            console.log(` addPreBonusOrder => :${orderObj}`)
             if (!hasOpened) {
                reject(1)
            }else if (orderObj.length < 1) {
                reject(1)
            }else{
                 let orderList = [];
                for (let order of orderObj) {
                    orderList.push({
                        orderId:order.orderId,
                        playerId:order.playerId,
                        moneyType:order.moneyType,
                        bonus:order.bonus,
                        betType:order.betType,
                        number:order.number,
                        betTimeStamp:betTimeStamp,      //发给服务器的time
                    });
                }
                PreBonusOrder.insertMany(orderList, (error, doc)=>{
                    if (error) {
                        console.log('pre bonus order insert failed', error);
                        reject(1)
                        return;
                    }
                    resolve()
                });
            }
        });
    },



     /**
     * 删除预中奖订单数据
     * @param {string[]} orderObj 订单列表
     */
    delPreBonusOrder (orderObj) {
        return new Promise((resolve, reject) => {
             console.log(`删除预中奖订单数据:${orderObj}`)
            if (!hasOpened) {
                reject(`mongoose hasOpened is ${hasOpened}`)
                return;
            } 
            if (orderObj.length < 1) {
                resolve(1)
                return;
            }
            PreBonusOrder.deleteMany({orderId:{$in:orderObj}}, (err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                resolve(1);
            });
        });
       
    },

     /**
     * 服务器确认中奖订单数据
     * @param {string[]} orderObj 订单列表
     */
    confrimPreBonusOrder(orderObj){
        return new Promise((resolve, reject) => {
             console.log(`服务器确认中奖订单数据:${orderObj}`)
            if (!hasOpened) {
                reject(`mongoose hasOpened is ${hasOpened}`)
                return;
            } 
            if (orderObj.length < 1) {
                resolve(1)
                return;
            }
            PreBonusOrder.update({orderId:{$in:orderObj}},{$set:{sendStatus:1}}, (err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                resolve(1);
            });
        });
    },

    /**
     * 保存有效中奖订单数据
     * @param {string[]} orderObj 订单列表
     * @param {string} date 日期(格式：年月日)
     */
    addRealBonusOrder (orderObj, date) {
        return new Promise((resolve, reject) => {
            console.log(`保存有效中奖订单数据:${orderObj}`)
            if (!hasOpened) {
                reject(1)
                return;
            }
            if (orderObj.length < 1) {
                reject(1)
                return;
            }
            if (null == date) {
                date = Tools.DayDateNumber();
            }
            if (date !== nowDate) {
                nowDate = date;
                RealBonusOrder = mongoose.model(nowDate+COLLECTIONSNAME._RealBonusOrder, bonusOrderSchema);
            }
            let orderList = [];
            for (let order of orderObj) {
                orderList.push({
                    orderId:order.order,
                    playerId:order.id,
                    moneyType:order.money_type,
                    bonus:order.money,
                    gameType:order.gameType,
                    lotteryCode:order.lotteryCode
                });
            }
            RealBonusOrder.insertMany(orderList, (error, doc)=>{
                if (error) {
                    console.log('pre bonus order insert failed', error);
                    reject(error)
                    return;
                }
                let orderList = [];
                for (let item of doc) {
                    orderList.push(item.orderId);
                }
                this.delPreBonusOrder(orderList).then( ()=>{
                    resolve(1)
                } ).catch( (error) =>{
                    reject(error);
                } )
                
            });
        });
        
    },

     /**
     * 保存彩源开奖期号数据
     * @param {string} lotteryCode 彩源
     * @param {string} issueId 开奖期号
     */
    addLotteryIssueRecord (lotteryCode, issueId) {
        console.log(`mongodn-addLotteryIssueRecord ==>>`)
        LotteryRecordModel.update({issue:issueId,lotteryCode:lotteryCode},{$set:{date:nowDate,winList:[],sendStatus:0}}, {upsert:true}, (err, res) =>{
            if(err){
                console.log(`mongodb-addLotteryIssueRecord error:${err}`)
                return
            }
            console.log(`mongodn-addLotteryIssueRecord ==>> suc`)
        })
        // let record = new LotteryRecordModel({
        //     lotteryCode:lotteryCode,
        //     issue:issueId,
        //     date:nowDate,
        //     winList:[],
        //     sendStatus:0,   //发送服务器的状态
        // });
        // record.save();
    },
    /**
     * 更新彩源开奖数据
     * @param {string} data 彩源
     */
     updateLotteryCode(issue,code,opendate){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-updateLotteryCode ==>>`)
            LotteryRecordModel.update({issue:issue},{$set:{code:code, opendate:opendate}}, (error, res)=>{
                if(error){
                    reject(error)
                }else{
                    resolve(res);
                }
            });
        });
    },
    /**
     * 更新彩源开奖数据
     * @param {string} issue 彩源期号
     * @param {string} lotteryCode 彩源cide
     * @param {string} winList 赢的数组
     */
    updateLotteryWinRecord(issue,lotteryCode, winList){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-updateLotteryWinRecord ==>>`)
            LotteryRecordModel.update({lotteryCode:lotteryCode,issue:issue},{$push:{winList:{$each:winList} }}, (error, res)=>{
                if(error){
                    reject(error)
                }else{
                    resolve(res);
                }
            });
        });
    },

    /*
    *  获取所有未发送的彩源开奖期号数据
    *
    */
    getNoSendData_lotteryIssue(){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-getNoSendData_lotteryIssue ==>>`)
             LotteryRecordModel.find({sendStatus:0},(err, res)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            });
        });
    },

    /*
    *  更新已发送的彩源开奖期号数据
    *
    */
    updateSendData_lotteryIssue(lotteryCode){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-updateSendData_lotteryIssue ==>>`)
            if(lotteryCode){
                LotteryRecordModel.update({lotteryCode:lotteryCode},{$set:{sendStatus:1}},(err, res)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(res);
                    }
                })
            }else{
                resolve(1)
            }
        });
    },


    addAutoBetOrder (orderObj, callback) {
        console.log(`mongodn-addAutoBetOrder ==>>`)
        if (!hasOpened) {
            return;
        }
        AutoBetOrderModel.insertMany(orderObj, (error, doc)=>{
            if (error) {
                console.error(error);
                callback(false);
                return;
            }
            callback(true);
        });
    },
    
    delAutoBetOrder (playerId, lotteryCode, gameType, callback) {
        if (!hasOpened) {
            return;
        }
        AutoBetOrderModel.deleteMany({playerId:playerId, lotteryCode:lotteryCode, gameType:gameType}, (err)=>{
            if (err) {
                console.error(err);
                callback(false);
                return;
            }
            callback(true);
        });
    },
     findAutoBetOrderFromPlayer (playerId, lotteryCode, gameType, callback) {
        if (!hasOpened) {
            return;
        }
        AutoBetOrderModel.find({playerId:playerId, lotteryCode:lotteryCode, gameType:gameType}, (err, res)=>{
            callback(err, res);
        });
    },
    findAutoBetFromGame (lotteryCode, gameType, callback) {
        if (!hasOpened) {
            return;
        }
        AutoBetOrderModel.find({lotteryCode:lotteryCode, gameType:gameType}, (err, res)=>{
            if (err) {
                console.error('find auto bet from game failed', err);
            }
            callback(err, res);
        });
    },

    addGameIssueRecord (lotteryCode, issue, gameType) {
        if (!hasOpened) {
            return;
        }
        GameIssueRecordModel.update({lotteryCode:lotteryCode, gameType:gameType}, {$set:{issueId:issue}}, {upsert:true}, (err, raw)=>{
            if (err) {
                console.error('save game issue record failed, err=', err);
            }
        });
    },

    findPastIssueFromGame (lotteryCode, gameType, callback) {
        if (!hasOpened) {
            return;
        }
        GameIssueRecordModel.find({lotteryCode:lotteryCode, gameType:gameType}, (err, res)=>{
            if (err) {
                console.error('find past game issue failed, err=', err);
                callback(null);
                return;
            }
            callback(res[0]);
        });
    },

    //以下函数用来保存和服务器对账的数据
    addSumbitOrderRecord (data, date, submitType) {
        if (!hasOpened) {
            return;
        }
        date = Tools.TimeToDate(date*1000);
        if (date !== nowDate) {
            nowDate = date;
            SumbitOrderModel = mongoose.model(nowDate+COLLECTIONSNAME._SumbitOrderRecord, sumbitOrderSchema);
        }

        let record = new SumbitOrderModel({
            orderType:submitType,
            orderCount:data.length,
            orderList:data
        });
        record.save();
    },

    addReceiveOrderRecord (success, err, date) {
        return new Promise((resolve, reject) => {
             if (!hasOpened) {
                reject(1)
                return;
            }
            if (date !== nowDate) {
                nowDate = date;
                ReceiveOrderModel = mongoose.model(nowDate+ COLLECTIONSNAME._ReceiveOrderRecord, receiveOrderSchema);
            }
            if (null == err) {
                err = [];
            }
            if (null == success) {
                success = [];
            }
            let record = new ReceiveOrderModel({
                errorCount:err.length,
                errorList:err,
                successCount:success.length,
                successList:success
            });
            record.save();
            resolve(1)
        });
    },
    
    //以下函数供查询使用
    findAllReceiveOrder (callback) {
        if (!hasOpened) {
            return;
        }
        ReceiveOrderModel.find({}, (err, res)=>{        
            if (err) {
                console.error('find betItem failed', err);
            }
            callback(err, res);
        });
    },

    findAllPayOrder (callback) {
        if (!hasOpened) {
            return;
        }
        RealPayOrder.find({}, (err, res)=>{        
            if (err) {
                console.error('find betItem failed', err);
            }
            callback(err, res);
        });
    },
    getSendOrderCount (callback) {
        if (!hasOpened) {
            return;
        }
        RealPayOrder.find({}, (err, res)=>{        
            if (err) {
                console.error('find betItem failed', err);
            }
            callback(err, res);
        });
    }
}