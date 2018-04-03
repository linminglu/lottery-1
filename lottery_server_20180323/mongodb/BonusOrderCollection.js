const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');
const Tools = require('../util/Tools.js');

class BonusOrderCollection {
	constructor(collectionName,Schema) {
	    this.bonusOrderSchema = new Schema({
	        orderId:String,
	        playerId:String,
	        moneyType:Number,
	        bonus:Number,
	        betType:Number,
	        betTimeStamp:Number,
	        sendStatus:{type:Number, default:0},
	    });
	    this.model;
	    this.init(collectionName);
	}

	init(collectionName){
		this.model = mongoose.model( collectionName, this.bonusOrderSchema);
	}

	// 更新
    updateSendData_preBonusOrder(date){
        return new Promise((resolve, reject) => {
             if(!MongodbTool.hasOpened){
                reject(1);
                return;
            }
            console.log(`正在更新的已发送的数据 => updateSendData_preBonusOrder date:${date}`);
            if(date){
                this.model.update({betTimeStamp:date},{$set:{sendStatus:1}},{upsert:true,multi:true},(err, res)=>{
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
    }

    /**
     * 保存预中奖订单数据
     * @param {any[]} orderObj 订单列表
     * @param {function} 
     */
    addPreBonusOrder(orderObj, betTimeStamp){
        return new Promise((resolve, reject) => {
            if(!MongodbTool.hasOpened){
                resolve(1);
                return;
            }
            console.log(`mongodb-addPreBonusOrder ==>> `)
            if (orderObj.length < 1) {
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
                this.model.insertMany(orderList, (error, doc)=>{
                    if (error) {
                        console.log('pre bonus order insert failed', error);
                        reject(1)
                        return;
                    }
                    resolve()
                });
            }
        });
    }

     /**
     * 服务器确认中奖订单数据
     * @param {string[]} orderObj 订单列表 key:create_time
     * @param {string[]} orderObj 订单列表 key:create_time
     */
    confrimPreBonusOrder(sucOrderObj, errOrderObj){
        return new Promise((resolve, reject) => {
            console.log(`mongodb-confrimPreBonusOrder ==>> `)
            if(!MongodbTool.hasOpened){
                resolve(1);
                return;
            }
            let sucOrderList = [];
            let errOrderList = [];
            let arr,order,create_time;
            sucOrderList = Tools.getObjInArrInArgs(sucOrderObj,'order')
            errOrderList = Tools.getObjInArrInArgs(errOrderObj,'order')

            this.confrimStatusPreBonusOrder(sucOrderList,1).then(this.confrimStatusPreBonusOrder(errOrderList,2) ).then(
                ()=>{
                    console.log(`mongodb-confrimPreBonusOrder ==>> suc`)
                    resolve(1);
                }
            ).catch(
                (err)=>{
                    reject(err)
                }
            )            
        });
    }

    /**
     * 服务器确认中奖订单数据
     * @param {string[]} orderObj 订单列表 key:create_time
     * @param {string[]} orderObj 订单列表 key:create_time
     */
    confrimStatusPreBonusOrder(orderList, orderStatus){
        return new Promise((resolve, reject) => {
            if(!MongodbTool.hasOpened){
                resolve(1)
                return;
            }
            if(orderList.length<1){
                resolve(1);
                return;
            }
            this.model.update({orderId:{$in:orderList}},{$set:{sendStatus:1,orderStatus:orderStatus}}, {upsert:true,multi:true},(err)=>{
                if (err) {
                    console.error('pre pay order delete failed', err);
                    reject(err)
                    return;
                }
                console.log(`mongodb-confrimPreBonusOrder ==>> suc`)
                resolve(1);
            });
        });
    }
}

module.exports = BonusOrderCollection;