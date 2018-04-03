const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');
const Tools = require('../util/Tools.js');

class LotteryRecordCollection {
	constructor(collectionName, Schema) {
		// code
		this.schema = new Schema({
	        lotteryCode:String,//彩源代码
	        issue:String,//期号
	        date:String,//日期
	        winList:Array,//赢的数据
	        code:{type:String, default:0},  // 
	        opendate:{type:String, default:0},// 开奖时间
	        // winPlay
	        sendStatus:{type:Number, default:0},
	    });
	    this.model;
	    this.init(collectionName);
        this.nowDate = Tools.DayDateNumber().toString();
	}

	// methods
	init(collectionName){
		this.model = mongoose.model(collectionName, this.schema);
	}

	/**
     * 保存彩源开奖期号数据
     * @param {string} lotteryCode 彩源
     * @param {string} issueId 开奖期号
     */
    addLotteryIssueRecord (lotteryCode, issueId) {
        console.log(`mongodb-addLotteryIssueRecord ==>>`)
        this.model.update({issue:issueId,lotteryCode:lotteryCode},{$set:{date:this.nowDate,winList:[],sendStatus:0}}, {upsert:true,multi:true}, (err, res) =>{
            if(err){
                console.log(`mongodb-addLotteryIssueRecord error:${err}`)
                return
            }
            console.log(`mongodn-addLotteryIssueRecord ==>> suc`)
        })
    }
     /**
     * 更新彩源开奖数据
     * @param {string} data 彩源
     */
     updateLotteryCode(issue,code,opendate){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-updateLotteryCode ==>>`)
            this.model.update({issue:issue},{$set:{code:code, opendate:opendate}}, (error, res)=>{
                if(error){
                    reject(error)
                }else{
                    resolve(res);
                }
            });
        });
    }

    /**
     * 更新彩源开奖数据
     * @param {string} issue 彩源期号
     * @param {string} lotteryCode 彩源cide
     * @param {string} winList 赢的数组
     */
    updateLotteryWinRecord(issue,lotteryCode, winList){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-updateLotteryWinRecord ==>>`)
            this.model.update({lotteryCode:lotteryCode,issue:issue},{$push:{winList:{$each:winList} }}, (error, res)=>{
                if(error){
                    reject(error)
                }else{
                    resolve(res);
                }
            });
        });
    }

    /*
    *  获取所有未发送的彩源开奖期号数据
    *
    */
    getNoSendData_lotteryIssue(){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-getNoSendData_lotteryIssue ==>>`)
             this.model.find({sendStatus:0},(err, res)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            });
        });
    }

    /*
    *  更新已发送的彩源开奖期号数据
    *
    */
    updateSendData_lotteryIssue(lotteryCode){
        return new Promise((resolve, reject) => {
            console.log(`mongodn-updateSendData_lotteryIssue ==>>`)
            if(lotteryCode){
                this.model.update({lotteryCode:lotteryCode},{$set:{sendStatus:1}},(err, res)=>{
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
    }

}

module.exports = LotteryRecordCollection;