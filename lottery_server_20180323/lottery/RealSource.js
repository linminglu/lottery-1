const util = require('util'),
    request = require('request'),
    EventHandler = require('../event/event.js');

const urlHead = 'http://free.manycai.com/K25a4072e6ef333/';


class RealSource{
    /**
     * 初始化彩源
     * @param {string} code 彩源编号
     */
    constructor(code){
        this.source = code;
        this.requestLotteryList(code);
    }
    /**
     * 拉取彩源最近30期开奖数据
     * @param {string} code 彩源代码
     */
    requestLotteryList(code){
         let url = `${urlHead}${code}-30.json`;
        console.log(`${code}近期开奖历史`);
        request.get(url,  (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let codelist = JSON.parse(body);                     
                if (util.isArray(codelist)) {
                    // console.log(codelist);
                    shareData.eventHandler.emit(EVENTNAME.inner_event_lotterylist_ + codelist[0].lotterycode, codelist);
                }
            }
        });
    }
    /**
     * 拉取下一期开奖数据
     * @param {any} params
     * @param {string} params.issue 期号
     * @param {string} params.code 奖源代码
     */
    requestNextLottery(params) {
        let url = `${urlHead}${params.issue}/${params.code}.json`;
        console.log(`拉取彩源${params.code}第${params.issue}期开奖数据 => url:${url}`);
        request.get(url,  (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let codelist = JSON.parse(body);                     
                if (util.isArray(codelist)) {
                    console.log(codelist);
                    console.log('lottery url=', url);
                    shareData.eventHandler.emit( EVENTNAME.inner_event_open_ + codelist[0].lotterycode, codelist[0]);
                    shareData.eventHandler.emit( EVENTNAME.inner_event_new_lottery_ + codelist[0].lotterycode, codelist[0]);
                }
            }
        });
    }
    /**
     * 拉取往期开奖数据
     * @param {any} params {issue:期号,code:奖源代码}
     */
    requestPastLottery(params) {
        let url = `${urlHead}${params.issue}/${params.code}.json`;
        console.log(`拉取彩源${params.code}过期${params.issue}开奖数据`);
        request.get(url,  (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let codelist = JSON.parse(body);                     
                if (util.isArray(codelist)) {
                    // console.log(codelist);
                    shareData.eventHandler.emit( EVENTNAME.inner_event_open_ + codelist[0].lotterycode, codelist[0]);
                }
            }
        });
    }
}

module.exports = RealSource;