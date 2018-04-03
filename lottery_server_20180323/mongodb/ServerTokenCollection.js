const mongoose = require('mongoose');
const MongodbTool = require('./mongodb.js');

class ServerTokenCollection  {
	constructor(collectionName, Schema) {
		this.schema = new Schema({
			name:String,
			token:String,
			createTime:Number,  // 创建时间
			saveTime:Number,	// 失效时间
		})
		// code
		this.model;
		this.init(collectionName);
	}

	// methods
	init(collectionName){
		this.model = mongoose.model(collectionName,this.schema)
	}

	/** 获取token
	* @parms{string} name 保存的token名字
	* @parms{string} time 失效时间
	* @parms{string} token  
	*/
	getToken(name){
		return new Promise((resolve, reject) => {
			if(!MongodbTool.hasOpened){
                resolve(1);
                return;
            }
			this.model.findOne({name:name},(err, res) =>{
				if(err){
					reject(err)
				}else{
					resolve(res)
				}
			})
		});
	}

	/** 更新token
	* @parms{string} name 保存的token名字
	* @parms{string} time 失效时间
	* @parms{string} token  
	*/
	updateToken(token,name,time){
		return new Promise((resolve, reject) => {
			if(!MongodbTool.hasOpened){
                resolve(1);
                return;
            }
			this.model.update({name:name},{$set:{token:token,time,time}},{upsert:true,multi:true}, (err,res)=>{
				if(err){
					reject(err)
				}else{
					resolve(res)
				}
			})
		});
	}

	/** 保存新的token
	* @parms{string} name 保存的token名字
	* @parms{string} time 失效时间
	* @parms{string} token  
	*/
	saveToken(name,time,token){
		let record = new this.model({
			name:name,
			time:time,
			token:token
		});
		record.save();
	}
}

module.exports =  ServerTokenCollection;