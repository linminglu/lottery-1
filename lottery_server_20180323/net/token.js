const request = require('request');
let url;
let isFirst = true;

let getTokenInfo = () => {
    return new Promise((resolve, reject) => {
        url = `${shareData.dev_url}/Token/GetToken?dev_name=${shareData.dev_name}&dev_key=${shareData.dev_key}&dev_bind_id=${shareData.dev_bind}`;
        console.log(`net-token-getTokenInfo:==>>`)
        request.get(url, function (error, response, body) {
            if(error){
                reject(error)
                return;
            }
            if (!error && response.statusCode == 200) {
                if (body.length < 1) {
                    console.error('request token failed, body is empty');
                    return;         
                }
                let info = JSON.parse(body);            
                if (info.status == 'ERROR') {
                    console.error('request token failed, msg=' + info.msg);
                    return;
                }
                console.log(`net-token-getTokenInfo==>> 是否第一次连接-${isFirst}`);
                shareData.dev_token = info.msg.token;
                if (isFirst) {
                    isFirst = false;
                     resolve(isFirst)
                    shareData.eventHandler.emit(EVENTNAME.inner_event_token_ready);
                }
                 resolve(isFirst)
            }
        });
    });

};

let token =  () =>  {
    
   return getTokenInfo();
};

module.exports = token;