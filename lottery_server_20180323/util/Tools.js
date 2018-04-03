const crypto = require('crypto');
const moment = require('moment');   // 时间处理

let Tools = {};

Tools.Error = {
    LoginFail: 3,
    BettingDataError: 4,
    MoneyNoEnough: 5,
    UndoOrderError: 6
};

Tools.MD5 =  (params) => crypto.createHash('md5').update(params).digest('hex'); 

Tools.DayDate =  () => {
    let nowDate = new Date();
    let time = nowDate.getFullYear() + "-" + (nowDate.getMonth() < 10 ? '0' + (nowDate.getMonth() + 1) : (nowDate.getMonth() + 1)) + "-" + (nowDate.getDate() < 10 ? '0' + nowDate.getDate() : nowDate.getDate());
    return time;
};
/** 
 * 获取当天日期：年月日20180214
 */
Tools.DayDateNumber =  () => {
    return moment().format('YYYYMMDD');  
}

/**
 * 时间戳转化为年月日格式的日期
 * @param {number} nowTime 时间戳
 */
Tools.TimeToDate =  (nowTime) => {
     return moment(nowTime).format('YYYYMMDD');  
}

// console.log(d); 
Tools.PadNumber =  (num, fill) => {
    let len = ('' + num).length;
    return (Array(
        fill > len ? fill - len + 1 || 0 : 0
    ).join('0') + num);
};

Tools.string10to62 =  (number) => {
    let chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split(''),
      radix = chars.length,
      qutient = +number,
      arr = [];
    do {
      mod = qutient % radix;
      qutient = (qutient - mod) / radix;
      arr.unshift(chars[mod]);
    } while (qutient);
    let len = arr.length;
    return (Array(
        6 > len ? 6 - len + 1 || 0 : 0
    ).join('0') + arr.join(''));
};
  
Tools.string62to10 =  (number_code) => {
    var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ',
      radix = chars.length,
      number_code = String(number_code),
      len = number_code.length,
      i = 0,
      origin_number = 0;
    while (i < len) {
      origin_number += Math.pow(radix, i++) * chars.indexOf(number_code.charAt(len - i) || 0);
    }
    return origin_number;
};
/**
 * 生成minNum(minNum大于0)~maxNum(不包括maxNum)之间的整数
 * @param {number} minNum 随机数下限 
 * @param {number} maxNum 随机数上限
 */
Tools.randomNum =  (minNum, maxNum) => {
    if (minNum === maxNum) {
        return minNum;
    }
    return Math.floor(Math.random()*(maxNum-minNum+1)+minNum);
};
/**
 * 生成0~maxNum(不包括maxNum)之间的整数
 * @param {number} maxNum 
 */
Tools.randomNum1 =  (maxNum) => {
    if (0 >= maxNum) {
        return 0;
    }
    return Math.floor(Math.random()*maxNum);
};
/**
 * 字符串转换为数值型数组
 * "1,2,3,4,5"转为[1,2,3,4,5]
 * @param {string} str 需要转换的字符串
 */
Tools.stringToIntArray =  (str) => {
    str = str.split(",");
    if (str.length < 1) {
        return [];
    }
    //string数组转number数组
    let intnums = [];
    str.forEach(num => {
        intnums.push(parseInt(num));
    });
    return intnums;
};
/**
 * 对象转换为对象数组
 * {} => []
 * @param {string} str 需要转换的字符串
 */
Tools.ObjectToArray = (obj) =>{
    let arr = [];
    for(let item in obj){
        obj[item]._id = item;
        arr.push(obj[item])
    }
    return arr;
}


/*
* 将对象里的数组合并，并提取全部对象中一个属性，
* string  args 属性名
**/

Tools.getObjInArrInArgs = (obj, args) =>{
    let arr = []
    let list = []
    // 将所有的数组合并
    for(let create_time in obj){
        arr = arr.concat( obj[create_time])
    }
    for(let item of arr){
        if(item[args]){
            list.push(item[args])
        }
    }
    return list;
}

module.exports = Tools;