const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');


class ReceiveOrderCollection {
	constructor(collectionName,nowDate,Schema) {
		// code
		ReceiveOrderCollection.schema = new Schema({
	        errorCount:Number,
	        successCount:Number,
	        errorList:Array,
	        successList:Array,
	        sendStatus:{type:Number, default:1},
	    },{
	        timestamps:true
	    });
	    this.model;
	    this.collectionName = collectionName;
	    this.init(nowDate+collectionName);
	}
	// methods
	init(collectionName){
		this.model = mongoose.model( collectionName, ReceiveOrderCollection.schema);
	}

	 //以下函数供查询使用
    findAllReceiveOrder (callback) {
    	if(!MongodbTool.hasOpened){
            resolve(1);
            return;
        }
        this.model.find({}, (err, res)=>{        
            if (err) {
                console.error('find betItem failed', err);
            }
            callback(err, res);
        });
    }

     addReceiveOrderRecord (success, err, date) {
        return new Promise((resolve, reject) => {
            console.log(`mongodb-addReceiveOrderRecord ==>> `)
            // 按照创建的时间保存对应时间的数据
            let saveData = {}
            for(let create_time in err){
                if(!saveData[create_time]){
                    saveData[create_time] = {}
                }
                if(!saveData[create_time].success){
                    saveData[create_time].success =[]
                }
                 if(!saveData[create_time].err){
                    saveData[create_time].err =[]
                }
                saveData[create_time].err = err[create_time]
                saveData[create_time].success = []
            }
            for(let create_time in success){
                if(!saveData[create_time]){
                    saveData[create_time] = {}
                }
                if(!saveData[create_time].success){
                    saveData[create_time].success =[]
                }
                 if(!saveData[create_time].err){
                    saveData[create_time].err =[]
                }
                saveData[create_time].success = success[create_time]
                saveData[create_time].success = success[create_time]
            }

            this.addReceiveOrderRecord_InsertMany(saveData).then( ()=>{
                resolve(1);
            } ).catch( (err)=>{
                console.log(`mongodb-addReceiveOrderRecord error: ${err} `)
                reject(err)
            })
        });
    }

    addReceiveOrderRecord_InsertMany(saveData){
        return new Promise((resolve, reject) => {
            console.log(`mongodb-addReceiveOrderRecord_InsertMany`)
            let ReceiveOrderModelAdd;
            for(let create_time in saveData){
    			let record = new this.model({
                    errorCount:saveData[create_time].err.length ,
                    errorList:saveData[create_time].err,
                    successCount:saveData[create_time].success.length,
                    successList:saveData[create_time].success 
				});
				record.save();
            }
            resolve(1)
        });
    }
}


module.exports = ReceiveOrderCollection;