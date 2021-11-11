const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const {
    variableSQLDynamic,
} = require("../helpers/functions");

exports.lastTCDRecord = async (db, dbMssql, query) => {
    try {
        let { pages, rows, queue, status, flag, CT_IVR, CT_Tranfer, startDate, endDate, Agent_Team } = query;

        let _query = '';
        let g_CallType = []; // group CallType
        let g_SkillGroup = []; // group SkillGroup

        Object.keys(query).forEach((item) => {

            if (item.includes("SG_Voice_")) {
                let groupNumber = item.replace("SG_Voice_", "");
                g_CallType.push(`${query[`CT_ToAgentGroup${groupNumber}`]},${query[`CT_Queue${groupNumber}`]}`);
                g_SkillGroup.push(`${query[item]}`);
            }
        });

        if(flag == 2) {
            _query = `USE ins1_recording
            exec report_request_recall_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}', '${Agent_Team}', '${status || "#"}' , '${queue || "#"}'
            `;
        }else if(flag == 3){
            _query = `USE ins1_recording
            exec report_request_recall_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR},  ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}', '${Agent_Team}' , '${status || "#"}' , '${queue || "#"}'
            `;
        }

        _logger.log("info", `lastTCDRecord ${_query}`);
        let resultQuery = await dbMssql.query(_query);

        return resultQuery;
    } catch (error) {
        throw new Error(error);
    }
};

/**
 * @param {object} query
 * @param {string} nameTable
 * @param {string} nameTCDDetail
 */
function selectCallDetailByCustomer(query, nameTable) {
    let { skillGroups, startDateFilter, endDateFilter } = query;
    // CT-5016
    let conditionFilter = ``;
    let CT_ToAgent_Dynamic = [];
    let CT_Queue_Dynamic = [];
    let JOIN_Dynamic = [];

    Object.keys(query).forEach((item) => {
        const element = query[item];
        if (item.includes("CT_ToAgentGroup")) {
            CT_ToAgent_Dynamic.push(`@${item}`);
        }

        if (item.includes("CT_Queue")) {
            CT_Queue_Dynamic.push(`@${item}`);
        }

        if (item.includes("SG_Voice_")) {
            let groupNumber = item.replace("SG_Voice_", "");
            JOIN_Dynamic.push(`
                OR(${nameTable}.SkillGroupSkillTargetID is null
                AND ${nameTable}.CallTypeID in (@CT_ToAgentGroup${groupNumber}, @CT_Queue${groupNumber}) and SG.SkillTargetID = @SG_Voice_${groupNumber})
            `);
        }
    });

    switch (parseInt(query.flag)) {
        case 2:
            return `
            SELECT * from (
                SELECT TempTable.DateTime,TempTable.startTime,TempTable.ANI,TempTable.SkillGroupSkillTargetID,
                    DIRECTION = 
                    CASE
                    WHEN TempTable.inbound >=1
                        then 0 
                    WHEN TempTable.outbound >=1
                        then 0
                    ELSE 1
                    END 
                FROM(
                    SELECT
                    [DateTime]
                    ,[Duration]
                    ,DATEADD(ss , -Duration, DateTime) AS startTime
                    ,[DigitsDialed]
                    ,[RecoveryKey]
                    ,CASE
                    WHEN SkillGroupSkillTargetID is null and CallTypeID in (@CT_ToAgentGroup1, @CT_Queue1)
                        then @SG_Voice_1
                    WHEN SkillGroupSkillTargetID is null and CallTypeID in (@CT_ToAgentGroup2, @CT_Queue2)
                        then @SG_Voice_2
                    WHEN SkillGroupSkillTargetID is null and CallTypeID in (@CT_ToAgentGroup3, @CT_Queue3)
                        then @SG_Voice_3
                        else SkillGroupSkillTargetID
                    end SkillGroupSkillTargetID
                    ,
                    (
                        select count(*) FROM [${DB_HDS}].[dbo].[Termination_Call_Detail] as tcd
                        where tcd.DateTime >= ${nameTable}.DateTime
                        and tcd.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
                        AND tcd.AgentSkillTargetID is not null
                        AND tcd.TalkTime > 0
                        AND tcd.CallDisposition in (13, 28)
                        AND tcd.ANI = ${nameTable}.ANI
                    ) as inbound
                    ,
                    (
                        select count(*) FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] as tcd
                        where tcd.DateTime >= ${nameTable}.DateTime
                        AND tcd.PeripheralCallType in (9,10) --9 gọi ra cho KH,10 gọi ra nội bộ
                        AND tcd.CallDisposition in (14)
                        AND tcd.CallDispositionFlag in (1)
                        AND ${nameTable}.ANI = 
                        case
                            when 
                            DATALENGTH(tcd.DigitsDialed) = 10
                            then tcd.DigitsDialed  
                            else
                            SUBSTRING(tcd.DigitsDialed, 6, 11) 
                        end 
                    ) as outbound
                    ,[ANI]
                FROM ${nameTable}
                    WHERE DateTime >= @startDate
                    AND DateTime < @endDate
                    AND rn = 1 --lấy cuộc gọi cuối cùng
                    AND ${nameTable}.RecoveryKey not in (
                        Select RecoveryKey FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] t_TCD_handle
                        where  DateTime >= @startDate
                        AND DateTime < @endDate
                        AND (
                            -- loại các cuộc handle
                            AgentSkillTargetID is not null
                            AND t_TCD_handle.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
                            AND TalkTime > 0
                            AND CallDisposition in (13,28)
                        )
                    )
                ) TempTable ) TempTable2`;
        case 3:
            return `
            SELECT count(*) as totalPage from (
                SELECT TempTable.DateTime,TempTable.startTime,TempTable.ANI,TempTable.SkillGroupSkillTargetID,
                    DIRECTION = 
                    CASE
                    WHEN TempTable.inbound >=1
                        then 0 
                    WHEN TempTable.outbound >=1
                        then 0
                    ELSE 1
                    END 
                FROM(
                    SELECT
                    [DateTime]
                    ,[Duration]
                    ,DATEADD(ss , -Duration, DateTime) AS startTime
                    ,[DigitsDialed]
                    ,[RecoveryKey]
                    ,CASE
                    WHEN SkillGroupSkillTargetID is null and CallTypeID in (@CT_ToAgentGroup1, @CT_Queue1)
                        then @SG_Voice_1
                    WHEN SkillGroupSkillTargetID is null and CallTypeID in (@CT_ToAgentGroup2, @CT_Queue2)
                        then @SG_Voice_2
                    WHEN SkillGroupSkillTargetID is null and CallTypeID in (@CT_ToAgentGroup3, @CT_Queue3)
                        then @SG_Voice_3
                        else SkillGroupSkillTargetID
                    end SkillGroupSkillTargetID
                    ,
                    (
                        select count(*) FROM [${DB_HDS}].[dbo].[Termination_Call_Detail] as tcd
                        where tcd.DateTime >= ${nameTable}.DateTime
                        and tcd.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
                        AND tcd.AgentSkillTargetID is not null
                        AND tcd.TalkTime > 0
                        AND tcd.CallDisposition in (13, 28)
                        AND tcd.ANI = ${nameTable}.ANI
                    ) as inbound
                    ,
                    (
                        select count(*) FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] as tcd
                        where tcd.DateTime >= ${nameTable}.DateTime
                        AND tcd.PeripheralCallType in (9,10) --9 gọi ra cho KH,10 gọi ra nội bộ
                        AND tcd.CallDisposition in (14)
                        AND tcd.CallDispositionFlag in (1)
                        AND ${nameTable}.ANI = 
                        case
                            when 
                            DATALENGTH(tcd.DigitsDialed) = 10
                            then tcd.DigitsDialed  
                            else
                            SUBSTRING(tcd.DigitsDialed, 6, 11) 
                        end 
                    ) as outbound
                    ,[ANI]
                FROM ${nameTable}
                    WHERE DateTime >= @startDate
                    AND DateTime < @endDate
                    AND rn = 1 --lấy cuộc gọi cuối cùng
                    AND ${nameTable}.RecoveryKey not in (
                        Select RecoveryKey FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] t_TCD_handle
                        where  DateTime >= @startDate
                        AND DateTime < @endDate
                        AND (
                            -- loại các cuộc handle
                            AgentSkillTargetID is not null
                            AND t_TCD_handle.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
                            AND TalkTime > 0
                            AND CallDisposition in (13,28)
                        )
                    )
                ) TempTable ) TempTable2`;
    }
}

