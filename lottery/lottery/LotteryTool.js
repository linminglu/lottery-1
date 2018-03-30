const   Tool       = require('../util/Tools.js'),
        GAMETYPE   = require('../config/gameConfig.js').gameType;


/**
 * 获取重庆时时彩下一期期号
 * @param {string} issue 本期期号
 * @returns {string} 下一期期号
 */
let cqsscNextIssue = (issue) => {
    let date = issue.slice(0,-3);
    let roundId = parseInt(issue.slice(-3)) + 1;
    if (roundId > 120) {
        roundId = 1;
        date = Tool.DayDateNumber();
    }
    let next = date + Tool.PadNumber(roundId, 3);   
    return next;
}
/**
 * 获取重庆时时彩本期投注截止时间
 * @param {number} openTime 本期开奖时间
 * @returns {number} 本期投注截止时间
 */
let cqsscBetEndTime = (issue, openTime) => {
    let roundId = parseInt(issue.slice(-3)) + 1;
    if (roundId > 120) {
        roundId = 1;
    }  
    let end = 0;
    if (roundId>24 && roundId <= 95) {
        end = openTime + 600000 - 60000;//提前60秒截止
    } else if (roundId>=96 || roundId <= 23) {
        end = openTime + 300000 - 30000;//提前30秒截止
    } else if (roundId == 24) {
        end = openTime + (8*3600 + 5*60 - 60)*1000;//提前60秒截止
    }
    return end;
}
/**
 * 获取腾讯分分彩下一期期号
 * @param {string} issue 本期期号
 * @returns {string} 下一期期号
 */
let txffcNextIssue = (issue)=> {
    let date = issue.slice(0,-4);
    let roundId = parseInt(issue.slice(-4)) + 1;
    if (roundId > 1440) {
        roundId = 1;
        date = Tool.DayDateNumber();
    }
    let next = date + Tool.PadNumber(roundId, 4);
    return next;
}
/**
 * 获取腾讯分分彩本期投注截止时间：每分钟开一次奖
 * @param {number} openTime 本期开奖时间
 * @returns {number} 本期投注截止时间
 */
let txffcBetEndTime = (openTime) => openTime + 60000 - 10000;//提前10秒截止


/**
 * 获取北京PK10下一期期号
 * @param {string} issue 本期期号
 * @returns {string} 下一期期号
 */
let bjpkNextIssue = (issue) =>  (parseInt(issue) + 1).toString();

/**
 * 获取北京PK10本期投注截止时间：每5分钟开一次奖
 * @param {number} openTime 本期开奖时间
 * @returns {number} 本期投注截止时间
 */
let bjpkBetEndTime = (openTime) => {
    //检查本期开奖时间是否为当天最后一期，如果是，投注截止时间就是次日09:07
    let date = new Date(openTime);
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let end = 0;
    if (hour == 23 && minutes >= 57) {
        //当天最后一轮已经开出，下一轮间隔9小时10分钟
        end = openTime + (9*3600 + 9*60) * 1000;//提前60秒截止
    } else {
        end = openTime + 420000 - 60000;//提前60秒截止
    }
    return end;
}

let LotteryTool = {
    /**
     * 获取下一期期号
     * @param {any} info 本期开奖数据 
     * @returns {string} 下一期期号
     */
    getNextIssue (info) {
        if (info.lotterycode == GAMETYPE.CQSSC) {
            return cqsscNextIssue(info.issue);
        }else if (info.lotterycode == GAMETYPE.TXFFC) {
            return txffcNextIssue(info.issue);
        }else if (info.lotterycode == GAMETYPE.BJPK10) {
            return bjpkNextIssue(info.issue);
        }
    },
    /**
     * 获取本期投注截止时间
     * @param {any} info 本期开奖数据
     * @returns {number} 投注截止时间
     */
    getNowIssueEndTime (info) {
        let openTimeStamp = new Date(info.opendate + " GMT+0800").getTime();
        if (info.lotterycode == GAMETYPE.CQSSC) {
            return cqsscBetEndTime(info.issue, openTimeStamp);
        }else if (info.lotterycode == GAMETYPE.TXFFC) {
            return txffcBetEndTime(openTimeStamp);
        }else if (info.lotterycode == GAMETYPE.BJPK10) {
            return bjpkBetEndTime(openTimeStamp);
        }
    }
}

module.exports = LotteryTool;