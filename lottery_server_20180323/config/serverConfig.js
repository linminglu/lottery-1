/**
 * 服务器的配置信息
 */
module.exports = {
    // 服务器名字与ID
    id : 1,
    name : 'GS1',

    // 监听的端口号
    port : 8900,

    // telnet 的端口号
    telnetPort : 5001,

    // cluster 进程数量
    clusterNum : 4,

    // mysql 配置(前缀必须为 mysqlDb)127.0.0.1
    mysqlDb : {
        host : '127.0.0.1',
        port: 3306,
        database : 'lottery_db',
        user : 'root',
        password : '1354243',//ddz81118746
    },

    // mongoDB 配置信息
    mongoDB :{
        host : '127.0.0.1',
        port :27017,
        database:'lottery',
        selfCollectionsName:{
            "_SumbitOrderRecord":"_SumbitOrderRecord",
            "_ReceiveOrderRecord":"_ReceiveOrderRecord",
            "_RealBonusOrder":"_RealBonusOrder",
            "_RealPayOrder":"_RealPayOrder",
            "GameIssueRecord":"GameIssueRecord",
            "AutoBetOrderRecord":"AutoBetOrderRecord",
            "LotteryRecord":"LotteryRecord",            // 彩源开奖期号
            "PreBonusOrder":"PreBonusOrder",            // 预中奖订单
            "PrePayOrder":"PrePayOrder",                // 预定单
        }
    },

    // 服务器的地址
    serverIP:"10.73.2.254",

    // 服务器的端口号
    serverPort:9502,

    // 事件名
    eventName:{
        // 游戏事件
        "changeGameUserMoney":"/GameServer/GameUser/ChangeGameUserMoney",
        "getGameUser":"/GameServer/GameUser/GetGameUser",
        "rewriteGameUserMoney":"/GameServer/GameUser/RewriteGameUserMoney",
        "exitGame":"/GameServer/GameUser/ExitGame",
        "login":"/GameServer/login/login",

        // 服务器连接事件
        "inner_event_new_lottery":"inner_event_new_lottery",
        "inner_event_server_connect":"inner_event_server_connect",
        "inner_event_server_receive":"inner_event_server_receive",
        "inner_event_server_reconnect":"inner_event_server_reconnect",
        "inner_event_token_ready":"inner_event_token_ready",
        "inner_event_lotteryhistory_update":"inner_event_lotteryhistory_update",
        "inner_event_exitgame":"inner_event_exitgame",
        "inner_event_userinfo":"inner_event_userinfo",
        "inner_event_open_":"inner_event_open_",
        "inner_event_lotteryhistory_init":"inner_event_lotteryhistory_init",

        // 服务器连接事件的拼接
        "inner_event_lotterylist_":"inner_event_lotterylist_",
        "inner_event_new_lottery_":"inner_event_new_lottery_",

        "server_error_msg":"server_error_msg",

        "net_msg_select_betting_record":"net_msg_select_betting_record",
        "net_msg_select_lottery_record":"net_msg_select_lottery_record",

        "net_msg_login":"net_msg_login",
        "net_msg_login_result":"net_msg_login_result",
        "net_msg_lotteryrecord":"net_msg_lotteryrecord",
        "net_msg_select_auto_betting":"net_msg_select_auto_betting",
        "net_msg_auto_betlist":"net_msg_auto_betlist",
        "net_msg_betrecord":"net_msg_betrecord",
        "net_msg_bet_ranklist":"net_msg_bet_ranklist",
        "net_msg_bonus_ranklist":"net_msg_bonus_ranklist",
        "net_msg_select_online_player":"net_msg_select_online_player",
        "net_msg_online_player":"net_msg_online_player",
        "net_msg_logout":"net_msg_logout",
        "net_msg_betting":"net_msg_betting",
        "net_msg_betting_result":"net_msg_betting_result",
        "net_msg_enable_auto":"net_msg_enable_auto",
        "net_msg_enable_auto_betting":"net_msg_enable_auto_betting",
        "net_msg_cancel_auto":"net_msg_cancel_auto",
        "net_msg_cancel_auto_betting":"net_msg_cancel_auto_betting",
        "net_msg_bet_winning":"net_msg_bet_winning",
        "net_msg_newcode":"net_msg_newcode",
        "net_msg_race_betting":"net_msg_race_betting",
        "net_msg_update_money":"net_msg_update_money",
        "net_msg_connection":"net_msg_connection",
        "net_msg_error":"net_msg_error",

        "event_nologin":"event_nologin",
        "event_error":"event_error",
        "event_close":"event_close"

    },


}
