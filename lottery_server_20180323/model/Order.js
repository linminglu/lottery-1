const    Tools = require('../util/Tools.js'),
    limit = 100,
    SocketClient = require("../socket/SocketClient.js");

class Order{
    constructor(){
        this.cachePayOrder = [];
        this.cacheBonusOrder = [];
        this.internalSumbitPay = null;
        this.internalSumbitBonus = null;
    }
    /**
     * 向数据中心提交订单
     * @param {any[]} items 订单列表
     * @param {number} createTime
     */
    static submitOrderItem  (items, createTime, sumbitType ){
        let userList = [];
        for (let item of items) {
            userList.push([{order:item[0], id:item[1], money_type:item[2], money:item[3]*0.1, style:item[4], gameType:item[5], lotteryCode:item[6]}]);
        }
        SocketClient.changeUserMoney(userList, createTime, sumbitType);
    }

    // 向數據中心提交訂單列表
    submitOrderItemList (itemList,createTime,sumbitType = 1){
        if(!itemList){
            return;
        }
        // 重新確定數據格式
        let orderList = [];
        let singleList = [];
        let submitObj = {}

        // let count = 11;   // 测试使用限制数据发送

        for(let item of itemList){
            // --count;
            // if(count < 0){
            //     break;
            // }
            // console.dir(item)
            singleList = []
            submitObj = {};
            submitObj.order = item.orderId;
            submitObj.id = item.playerId;
            submitObj.money_type = item.money_type || 1;
            submitObj.money =  -item.betMoney;
            submitObj.style = item.style || 1;
            submitObj.gameType = item.gameType;
            submitObj.lotteryCode = item.lotteryCode;
            singleList.push(submitObj)
            orderList.push(singleList)
        } 
        SocketClient.changeUserMoney(orderList,createTime,sumbitType);
    }

    /**
     * 发送投注结果给用户
     * @param {string} pId 用户ID
     * @param {any} items 投注订单
     */
    static sendBetFailedMessage (pId) {
        shareData.socketServer.sendByUid(pId, EVENTNAME.net_msg_betting_result, '投注失败,余额不足', 2);
    }


    /**
     * 确认投注订单
     * @param {any[]} items 
     */
    distributeBetItem  (list) {
        return new Promise((resolve, reject) => {
            console.log(` order-distributeBetItem ->>  `)
            // console.dir(itemsD)
            if (list.length > 0) {
                shareData.gameMgr.addRealBetList(list);
            }
            // let itemZ;
            // for (let orderMsg of list) {
            //     itemZ = shareData.gameMgr.getBetItem(orderMsg);
            //     if (itemZ) {
            //         shareData.socketServer.sendByUid(orderMsg.id, EVENTNAME.net_msg_betting_result, itemZ);
            //     }
            // }
            resolve(1)
        });
        
    }

    internalSumbitPayCommand () {
        console.log(` Order-internalSumbitPayCommand ==>>>`)
        const data = this.cachePayOrder.shift();
        if (null == data) {
            return;
        }
        let sumbit = [];
        
        let item;
        for (let index = 0; index < limit; index++) {
            item = data.list.shift();
            if (null == item) {
                // this.cachePayOrder.shift();
                break;
            }
            sumbit.push([item.orderId, item.playerId, item.moneyType, -item.betMoney, 1, item.gameType, item.lotteryCode]);
        }
        if (data.list.length > 0) {
            this.cachePayOrder.unshift(data);
        }
        Order.submitOrderItem(sumbit, data.date, 1);
        if (this.cachePayOrder.length < 1) {
            clearInterval(this.internalSumbitPay);
            this.internalSumbitPay = null;
        }
    }

    internalSumbitBonusCommand  (){
        console.log(` Order-internalSumbitBonusCommand ==>>>`)
        const data = this.cacheBonusOrder.shift();
        if (null == data) {
            return;
        }
        let sumbit = [];
        let item;
        for (let index = 0; index < limit; index++) {
            item = data.list.shift();
            if (null == item) {
                this.cacheBonusOrder.shift();
                break;
            }
            item.bonus = (item.betMoney*item.betGain*0.001).toFixed(4);
            sumbit.push([item.orderId, item.playerId, item.moneyType, item.bonus, 2, item.gameType, item.lotteryCode]);
        }
        if (data.list.length > 0) {
            this.cacheBonusOrder.unshift(data);
        } 
        Order.submitOrderItem(sumbit, data.date, 2);
        if (this.cacheBonusOrder.length < 1) {
            clearInterval(this.internalSumbitBonus);
            this.internalSumbitBonus = null;
        }
    }

    /**
     * 增加订单(用户手动投注)
     * @param {any} data
     * @param {any[]} data.list 订单列表
     * @param {number} data.date 操作日期 
     */
    addOrderItem(data){
        console.log(` Order-addOrderItem ==>>>`)
        this.cachePayOrder.push(data);
        if (null == this.internalSumbitPay) {
            this.internalSumbitPay = setInterval(this.internalSumbitPayCommand.bind(this), 50);
        }
        let orderlist = data.list;
        let orderCount = orderlist.length;
        let item;
        for (let index = 0; index < data.length; index++) {
            item = orderlist[index];
            Order.submitOrderItem([[item.orderId, item.playerId, item.moneyType, -item.betMoney, 1, item.gameType, item.lotteryCode]], data.date, 1);
        }

    }
    /**
     * 中奖的订单
     * @param {any} data
     * @param {any[]} data.list 订单列表
     * @param {number} data.date 操作日期 
     */
    static addWinOrderItem(data){
        // this.cacheBonusOrder.push(data);
        // if (null == this.internalSumbitBonus) {
        //     this.internalSumbitBonus = setInterval(internalSumbitBonusCommand.bind(this), 50);
        // }
        let orderlist = data.list;
        let orderCount = orderlist.length;
        let item;
        for (let index = 0; index < orderCount; index++) {
            item = orderlist[index];
            item.bonus = (item.betMoney*item.betGain*0.001).toFixed(4);
            Order.submitOrderItem([[item.orderId, item.playerId, item.moneyType, item.bonus, 2, item.gameType, item.lotteryCode]], data.date, 2);

        }
    }
    /**
     * 彩源开错号码，纠正中奖数据
     * @param {*} data 
     */
    correctWinOrderItem(data){

    }

    /**
     * not_enough_list
     * success_list
     * 处理经过数据中心验证的有效订单
     * @param {Object} data
     * @param {any[]} data.error_list 资金不足的无效订单
     * @param {any[]} data.success_list 有效订单
     */
    handleValidOrder(data){
        console.log(`Order-handleValidOrder ==>>`)
        // console.dir(data)
        const {error_list = [],success_list} =data;

        let delPayList = [];
        let successPayList = [];
        let delBonusList = [];
        let successBonusList = [];
        if (error_list && error_list.length > 0) {
            let order;
            //从orderList中删除数据，如果用户在线，通知用户资金不足
            for (let itemsO of error_list) {
                order = itemsO[0].order;          
                if (itemsO[0].style == 1) {
                    Order.sendBetFailedMessage(itemsO[0].id);
                    delPayList.push(order);
                }else{
                    delBonusList.push(order);
                }               
            }
            // console.log(`delPayList =>`)
            // console.dir(delPayList)
            // console.log(`delBonusList =>`)
            // console.dir(delBonusList)
        }
        if (success_list && success_list.length > 0) {  
            let orderId;
            for (let itemsS of success_list) {
                orderId = itemsS[0].order;      
                if (itemsS[0].style == 1) {                    
                    successPayList.push(itemsS[0]);                     
                }else{
                    successBonusList.push(itemsS[0]);
                }       
            }
            // console.log(`success_list => ` );
            // console.dir(success_list)
            // console.log(`successPayList => `);
            // console.dir(successPayList);
            // console.log(`successBonusList => `);
            // console.dir(successBonusList)
        }
        let nowDate = Tools.TimeToDate(data.createTime*1000);

        // 更新信息已经收到
        shareData.mongooseClient.addReceiveOrderRecord(successPayList, error_list, nowDate).then(
            ()=>{
                console.log(`Order-handleValidOrder-distributeBetItem = >`)
                 return shareData.orderMgr.distributeBetItem(successPayList)//向游戏房间广播新增投注
            }
        ).then(
            ()=>{
                 console.log(`Order-handleValidOrder-confrimPrePayOrder = >`)
                return shareData.mongooseClient.confrimPrePayOrder(successPayList, delPayList)  // 确认订单是否成功
            }
        ).then(
            ()=>{
                console.log(`Order-handleValidOrder-confrimPreBonusOrder = >`)
                return shareData.mongooseClient.confrimPreBonusOrder(successBonusList, delBonusList) // 确认中奖订单
            }
        ).then(
            ()=>{
                if (successBonusList.length>0) {
                     console.log(`Order-handleValidOrder-addRealBonusOrder = >`)
                    shareData.mongooseClient.addRealBonusOrder(successBonusList, nowDate).then( ()=>{
                         console.log(` Order-handleValidOrder suc `)
                    })
                }else{
                    console.log(` Order-handleValidOrder suc `)
                }
            }
        ).catch( (error) =>{
            console.log(` Order-handleValidOrder error ==>> ${error}`)
        })
       
    }
}

module.exports = Order;