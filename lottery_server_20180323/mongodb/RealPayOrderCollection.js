const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');

class RealPayOrderCollection {
	constructor(collectionName, nowDate, Schema) {
		// code
		RealPayOrderCollection.schema = new Schema({
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

        RealPayOrderCollection.collectionName = collectionName;
		this.model;
		this.init(nowDate+collectionName);
	}

	// methods
	init(collectionName){
		this.model = mongoose.model(collectionName, RealPayOrderCollection.schema);
	}

	/**
     * 保存有效投注订单
     * @param {any[]} orderObj 订单列表
     * @param {string} date 日期(格式：年月日)
     */
    addRealPayOrder(orderObj, date){
        return new Promise((resolve, reject) => {
            console.log(`mongodb-addRealPayOrder ==>>`)
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
                this.model = mongoose.model(nowDate+ RealPayOrderCollection.collectionName, RealPayOrderCollection.schema);
            }

            this.model.insertMany(orderObj, (error, doc)=>{
                if (error) {
                    console.error('real pay order insert failed', err);
                    reject(1)
                    return;
                }
                let orderList = [];
                for (let item of doc) {
                    orderList.push(item.orderId);
                }
                let saveData = {}
                saveData[date] = orderList;
                // 确认已经投了
                shareData.MongooseClient.PayOrderModel.confrimPrePayOrder(saveData)
                .then( ()=>{
                    resolve();
                } ).catch( ()=>{
                    reject(1)
                } )
            });
        });
       
    }

     /**
     * 开奖后更新有效投注订单数据
     * @param {any[]} orderObj 订单列表
     * @param {string} date 日期(格式：年月日)
     */
    updateRealPayOrder (orderObj, date) {
        console.log(`mongodb-updateRealPayOrder ==>> `)
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
             this.model = mongoose.model(nowDate+ RealPayOrderCollection.collectionName, RealPayOrderCollection.schema);
        }
        this.model.find({orderId:{$in:orderIdList}}, (err, res)=>{
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
    }


}			


module.exports = RealPayOrderCollection;