const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');


class AutoBetOrderCollection {
	constructor(collectionName, Schema) {
		// code
    	this.schema = new Schema({
	        playerId:String,
	        gameType:Number,
	        betType:Number,
	        betMoney:Number,
	        lotteryCode:String,
	        sendStatus:{type:Number, default:0},
	    });
	    this.model;
	  	this.init(collectionName);
	}

	// methods
	init(collectionName){
		this.model = mongoose.model(collectionName, this.schema);
	}

	addAutoBetOrder (orderObj, callback) {
        console.log(`AutoBetOrderCollection-addAutoBetOrder ==>>`)
        this.model.insertMany(orderObj, (error, doc)=>{
            if (error) {
                console.error(error);
                callback(false);
                return;
            }
            callback(true);
        });
    }
    
    delAutoBetOrder (playerId, lotteryCode, gameType, callback) {
    	console.log(`AutoBetOrderCollection-delAutoBetOrder ==>>`)
        this.model.deleteMany({playerId:playerId, lotteryCode:lotteryCode, gameType:gameType}, (err)=>{
            if (err) {
                console.error(err);
                callback(false);
                return;
            }
            callback(true);
        });
    }

    findAutoBetOrderFromPlayer (playerId, lotteryCode, gameType, callback) {
    	console.log(`AutoBetOrderCollection-findAutoBetOrderFromPlayer ==>>`)
        this.model.find({playerId:playerId, lotteryCode:lotteryCode, gameType:gameType}, (err, res)=>{
            callback(err, res);
        });
    }

    findAutoBetFromGame (lotteryCode, gameType) {
    	console.log(`AutoBetOrderCollection-findAutoBetFromGame ==>>`)
        return new Promise((resolve, reject) => {
            this.model.find({lotteryCode:lotteryCode, gameType:gameType}, (err, res)=>{
                if (err) {
                    console.error('find auto bet from game failed', err);
                    reject(err)
                    return
                }
                resolve(res)
            });
        });
        
    }
}


module.exports = AutoBetOrderCollection;