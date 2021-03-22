const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const { FIELD_AGENT, TYPE_MISSCALL } = require("../helpers/constants");
const {
    checkKeyValueExists,
    reasonToTelehub,
    variableSQL,
    variableSQLDynamic,
} = require("../helpers/functions");
/**
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-13 00:00:00'
 *   , endDate: '2020-10-13 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.getReportReasonDropCall = async (db, dbMssql, query) => {
    try {
        let { pages, rows, paging, duration_g, wait_g, download, agentId, talking } = query;

        let querySelect = "";
        let queryCondition = "";
        let queryBlockTime = "";
        let queryQueue = "";
        let queryANI = "";
        let queryCauseEnd = "";
        let queryAgent = "";
        let queryTalking = "";
        let CT_ToAgent_Dynamic = [];
        let CT_Queue_Dynamic = [];

        Object.keys(query).forEach(item => {
            const element = query[item];
            if (
                item.includes("CT_ToAgentGroup")
            ) {
                CT_ToAgent_Dynamic.push(`@${item}`);
            }

            if (
                item.includes("CT_Queue")
            ) {
                CT_Queue_Dynamic.push(`@${item}`);
            }

        });
        // tìm kiếm theo block time
        if (query.blockTime) {
            queryBlockTime += `WHERE tempTable.genHourMinuteBlock in('${query.blockTime.replace(",", "','")}')`;
        }
        // tìm kiếm theo số điện thoại
        if (query.ANI) {
            queryANI += `AND ANI like '%${query.ANI}%'`;
        }

        if (agentId) {
            queryAgent += `AND AgentPeripheralNumber in (${agentId})`;
        }

        if (talking) {
            let [condi, value] = talking.split("=");
            console.log({condi, value});
            if(condi && value){
                switch (condi) {
                    case 'gt':
                        queryAgent += `AND TalkTime > (${value})`;
                        break;
                
                    case 'gte':
                        queryAgent += `AND TalkTime >= (${value})`;
                        break;

                    case 'lt':
                        queryAgent += `AND TalkTime < (${value})`;
                        break;
                
                    case 'lte':
                        queryAgent += `AND TalkTime <= (${value})`;
                        break;
                
                    default:
                        break;
                }
            }
        }
        // tìm kiếm theo queue
        if (query.Queue) {
            queryQueue += `AND DigitsDialed in('${query.Queue.replace(",", "','")}')`;
        }
        // tìm kiếm theo nguyên nhân kết thúc
        if (query.causeEnd) {
            if(query.causeEnd == "1"){
                queryCauseEnd += `AND ((direction ='IN_BOUND' AND origCause <> 0 ) OR (direction ='OUT_BOUND' AND origCause = 0 ))`;
            }else if(query.causeEnd == "2"){
                queryCauseEnd += `AND ((direction ='IN_BOUND' AND origCause = 0 ) OR (direction ='OUT_BOUND' AND origCause <> 0 ))`;
            }else{
                queryCauseEnd += `AND ((direction <> 'IN_BOUND' AND origCause <> 0 ) AND (direction <> 'OUT_BOUND' AND origCause = 0 ))`;
            }
            
        }

        if (paging == 1) {
            querySelect = `SELECT count(*) count`;
            if (duration_g) {
                duration_g.forEach((item) => {
                    querySelect += createChartConditions(item, "TalkTime");
                });
            }

            if (wait_g) {
                wait_g.forEach((item) => {
                    querySelect += createChartConditions(item, "Duration - temptable2.TalkTime");
                });
            }
            querySelect += `FROM(    
                SELECT * FROM(
                SELECT
                CASE
                WHEN (DATEPART(hour,CONVERT(DATETIME, DateTime))=DATEPART(hour,DATEADD(MINUTE,30,DateTime))) THEN CONCAT(FORMAT(DATEADD(MINUTE,-DATEPART(mi,DateTime),DateTime),'HH:mm'),' - ',FORMAT(DATEADD(MINUTE,30,DATEADD(MINUTE,-DATEPART(mi,DateTime),DateTime)),'HH:mm'))
                ELSE CONCAT(FORMAT(DATEADD(MINUTE,-DATEPART(mi,DateTime)+30,DateTime),'HH:mm'),' - ',FORMAT(DATEADD(MINUTE,30,DATEADD(MINUTE,-DATEPART(mi,DateTime)+30,DateTime)),'HH:mm'))
                END AS genHourMinuteBlock,TalkTime 
                FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail] TCD 
                inner join [${DB_RECORDING}].[dbo].[call_detail_record] record on (TCD.PeripheralCallKey - 16777216)  = record.callId --(PeripheralCallKey = callId+2^24) 
                WHERE DateTime >= @startDate
                and DateTime < @endDate
                  AND CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
                  and CallDisposition in (13, 6) -- 13: cuộc gọi inbound, 6: cuộc gọi tranfer
                  AND SkillGroupSkillTargetID is not null
                  AND AgentSkillTargetID is not null -- sau nay 
                  AND TalkTime > 0
                  ${queryANI}
                  ${queryQueue}
                  ${queryCauseEnd}
                  ${queryAgent}
                  ) tempTable
                  ${queryBlockTime}
                )temptable2 `;

        } else {
            querySelect = `
           SELECT * FROM(
           SELECT
           CASE
           WHEN (DATEPART(hour,CONVERT(DATETIME, DateTime))=DATEPART(hour,DATEADD(MINUTE,30,DateTime))) THEN CONCAT(FORMAT(DATEADD(MINUTE,-DATEPART(mi,DateTime),DateTime),'HH:mm'),' - ',FORMAT(DATEADD(MINUTE,30,DATEADD(MINUTE,-DATEPART(mi,DateTime),DateTime)),'HH:mm'))
           ELSE CONCAT(FORMAT(DATEADD(MINUTE,-DATEPART(mi,DateTime)+30,DateTime),'HH:mm'),' - ',FORMAT(DATEADD(MINUTE,30,DATEADD(MINUTE,-DATEPART(mi,DateTime)+30,DateTime)),'HH:mm'))
           END AS genHourMinuteBlock
          ,[DateTime]
          ,[RecoveryKey]
        --,[MRDomainID]
          ,[AgentSkillTargetID]
          ,[SkillGroupSkillTargetID]
          ,[ServiceSkillTargetID]
          ,[PeripheralID]
          ,[RouteID]
          ,[RouterCallKeyDay]
          ,[RouterCallKey]
        ,(
        select 
        MIN(TCDExtend.StartDateTimeUTC)
        from [${DB_AWDB}].[dbo].[Termination_Call_Detail] as TCDExtend
        where TCDExtend.RouterCallKey = TCD.RouterCallKey
        and TCDExtend.RouterCallKeyDay = TCD.RouterCallKeyDay
        )as FirstTimeCall
        ,[StartDateTimeUTC]
          ,[PeripheralCallType]
          ,[DigitsDialed]
          ,[PeripheralCallKey]
          ,[CallDisposition]
          ,[NetworkTime]
          ,[Duration]
          ,[RingTime]
          ,[DelayTime]
          ,[TimeToAband]
          ,[HoldTime]
          ,[TalkTime]
          ,[WorkTime]
          --,[LocalQTime]
          --,[BillRate]
          --,[CallSegmentTime]
          --,[ConferenceTime]
          ,[Variable1]
          ,[Variable2]
          ,[Variable3]
          ,[Variable4]
          ,[Variable5]
          ,[UserToUser]
          ,[NewTransaction]
          ,[RecoveryDay]
          ,[TimeZone]
          ,[NetworkTargetID]
          ,[TrunkGroupID]
          ,[DNIS]
          ,[InstrumentPortNumber]
          ,[AgentPeripheralNumber]
          ,[ICRCallKey]
          ,[ICRCallKeyParent]
          ,[ICRCallKeyChild]
          ,[Variable6]
          ,[Variable7]
          ,[Variable8]
          ,[Variable9]
          ,[Variable10]
          ,[ANI]
          ,[AnsweredWithinServiceLevel]
          ,[Priority]
          ,[Trunk]
          ,[WrapupData]
          ,[SourceAgentPeripheralNumber]
          ,[SourceAgentSkillTargetID]
          ,[CallDispositionFlag]
          ,[RouterCallKeySequenceNumber]
          ,[CED]
          ,[CallTypeID]
          ,[BadCallTag]
          ,[ApplicationTaskDisposition]
          ,[ApplicationData]
          ,[NetQTime]
          ,[DbDateTime]
          ,[ECCPayloadID]
          ,[CallTypeReportingDateTime]
          ,[RoutedSkillGroupSkillTargetID]
          ,[RoutedServiceSkillTargetID]
          ,[RoutedAgentSkillTargetID]
          ,[Originated]
          ,[CallReferenceID]
          ,[CallGUID]
          ,[LocationParamPKID]
          ,[LocationParamName]
          ,[PstnTrunkGroupID]
          ,[PstnTrunkGroupChannelNumber]
          ,[NetworkSkillGroupQTime]
          ,[EnterpriseQueueTime]
          ,[ProtocolID]
          ,[PrecisionQueueID]
          ,[PrecisionQueueStepOrder]
          ,[Attributes]
          ,[id]
		  ,[origCause]
          ,[direction]
          FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail] TCD 
          inner join [${DB_RECORDING}].[dbo].[call_detail_record] record on (TCD.PeripheralCallKey - 16777216)  = record.callId --(PeripheralCallKey = callId+2^24) 
          WHERE DateTime >= @startDate
          AND DateTime < @endDate
          AND CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
          and CallDisposition in (13, 6) -- 13: cuộc gọi inbound, 6: cuộc gọi tranfer
          AND SkillGroupSkillTargetID is not null
          AND AgentSkillTargetID is not null -- sau nay 
          AND TalkTime > 0
          ${queryANI}
          ${queryQueue}
          ${queryCauseEnd}
          ${queryAgent}
          ) tempTable`;
            if (download === 0) {
                queryCondition = `ORDER BY DateTime DESC
                OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY`;
            }
        }


        let _query = `
            ${variableSQLDynamic(query)}
            ${querySelect}
            ${paging != 1 ? queryBlockTime : ""}
            ${queryCondition}
        `;
        _logger.log("info", `lastTCDRecordAdvanced ${_query}`);
        return await dbMssql.query(_query);
    } catch (error) {
        throw new Error(error);
    }
};

function createChartConditions(item, field) {
    var arr = item.split("_");
    let _query = "";

    if (arr[1] == "lt") {
        _query = `,${arr[0]}_lt_${arr[2]}=sum(CASE  
                  WHEN temptable2.${field} < ${arr[2]} THEN 1 
                  ELSE 0 
                END) `;
    } else if (arr[1] == "gt") {
        _query = `,${arr[0]}_gt_${arr[2]}=sum(CASE  
                  WHEN temptable2.${field} > ${arr[2]} THEN 1 
                  ELSE 0 
                END) `;
    } else {
        _query = `,${arr[0]}_${arr[1]}_${arr[2]}=sum(CASE  
                when temptable2.${field} < ${arr[2]}
                and temptable2.${field} >= ${arr[1]} THEN 1 
                ELSE 0 
              END) `;
    }

    return _query;
}
