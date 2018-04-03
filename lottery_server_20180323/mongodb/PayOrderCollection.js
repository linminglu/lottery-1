// const COLLECTIONSNAME = server_config.mongoDB.selfCollectionsName;
const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');
const Tools = require('../util/Tools.js')

class PayOrderCollection {
	constructor(collectionName,Schema) {
		this.schema = new Schema({
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
	    this.model; // 控制数据库模块
	    this.init(collectionName);
	}

	// methods
	init(collectionName){
		// this.PrePayOrder = mongoose.model(COLLECTIONSNAME.PrePayOrder, payOrderSchema);
		this.model = mongoose.model(collectionName, this.schema);
	}

	// 获取未完成的下单数据
	getNoSendData_prePayOrder(){
		return new Promise((resolve, reject) => {
            console.log(`payOrderCollection-getNoSendData_prePayOrder ==>>`)
            this.model.find({sendStatus:0},function(err, data){
                if(err){
                    reject(err)
                }else{
                    resolve(data)
                }
            })
		});		
	}

	/**
     * 保存预投注订单
     * @param {any[]} orderObj 订单列表
     * @param {function} callback 回调函数
     */
    addPrePayOrder(orderObj, callback){
        return new Promise((resolve, reject) => {
            console.log(`mongodb-addPrePayOrder ==>> `)
            this.model.insertMany(Object.values(orderObj), (error, doc)=>{
                if (error) {
                    console.error('pre pay order failed', error);
                    reject(2)
                }else{
                     console.log(`mongodb-addPrePayOrder ==>> suc`)
                    resolve(doc);
                } 
            });
        });
    }

    /**
     * 服务器预投注订单
     * @param {string{}} sucOrderObj 成功订单列表 key: create_time
     * @param {string{}} errOrderObj 失败订单列表 key: create_time
     */
    confrimPrePayOrder (sucOrderObj, errOrderObj) {
        return new Promise((resolve, reject) => {
            console.log(`mongodb-confrimPrePayOrder ==>> `)
            // console.dir(sucOrderObj)
            // console.dir(errOrderObj)
            if(sucOrderObj.length < 1 && errOrderObj.length < 1) {
                // reject(`mongoose orderObj of length is <1 . ${orderObj}`);
                resolve(1)
                return;
            }

            let sucOrderList = [];
            let errOrderList = [];
            let arr,order,create_time;
            sucOrderList = Tools.getObjInArrInArgs(sucOrderObj,'order')
            errOrderList = Tools.getObjInArrInArgs(errOrderObj,'order')
            this.confrimStatusPrePayOrder(sucOrderList).then( this.confrimStatusPrePayOrder(errOrderList) ).then(
                ()=>{
                    console.log(`mongodb-confrimPrePayOrder ==>> suc`)
                    resolve(1);
                }
            ).catch(
                (err) =>{
                    reject(err)
                }
            )
        });
    }

    /**
     * 服务器预投注订单
     * @param [] orderList 成功订单列表 key: create_time
     * @param Number orderStatus 订单确认状态  1：确认  2：有问题、异常报错
     */
    confrimStatusPrePayOrder(orderList, orderStatus){
        return new Promise((resolve, reject) => {
            console.log(`mongodb-confrimSucPrePayOrder ==>>`)
            // console.dir(orderList)
            if(orderList.length < 1){
                resolve(1)
                return;
            }
            this.model.update({orderId:{$in:orderList}},{$set:{sendStatus:1,orderStatus:orderStatus}}, {upsert:true,multi:true} ,(err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                resolve()
            });
        });
    }
}

module.exports = PayOrderCollection;