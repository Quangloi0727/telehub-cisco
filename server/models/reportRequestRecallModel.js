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
        let { pages, rows, queue, status } = query
        let querySelect = "";
        let queryPage = "";
        let queryQueue = "";
        let queryStatus = "";
        let CT_Dynamic = [];
        const nameTableTCDLast = `t_TCD_last`;

        if (queue) {
            queryQueue += `Where TempTable.SkillGroupSkillTargetID IN (${queue})`
        }
        if (status) {
            if (queryQueue != "") {
                queryStatus += `AND TempTable.DIRECTION IN (${status})`
            } else {
                queryStatus += `WHERE TempTable.DIRECTION IN (${status})`
            }
        }

        querySelect = `${selectCallDetailByCustomer(
            query,
            nameTableTCDLast,
        )}`;
        if (rows) {
            queryPage = `
                OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY
            `;
        }
        Object.keys(query).forEach((item) => {
            const element = query[item];
            if (item.includes("CT")) {
                CT_Dynamic.push(`@${item}`);
            }
        });

        let _query = `
        ${variableSQLDynamic(query)}
        WITH ${nameTableTCDLast} AS (
            SELECT ROW_NUMBER() OVER (PARTITION BY  RouterCallKeyDay, RouterCallKey ORDER BY RouterCallKeySequenceNumber DESC, RecoveryKey DESC) AS rn
            ,*
            FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] as m
            where DateTime >= @startDate
            AND DateTime < @endDate
            AND CallTypeID in (${CT_Dynamic.join(",")})
        )
        ${querySelect}
        ${queryQueue}
        ${queryStatus}
        ORDER BY TempTable.DateTime DESC
        ${queryPage}`;

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

    return `
    SELECT * FROM(
        SELECT
        [DateTime]
       ,[Duration]
	   ,DATEADD(ss , -Duration, DateTime) AS startTime
       ,[DigitsDialed]
       ,[RecoveryKey]
       ,[SkillGroupSkillTargetID]
       ,DIRECTION =
        CASE
        WHEN
        (
            select count(*) FROM [${DB_HDS}].[dbo].[Termination_Call_Detail] as tcd
            where tcd.DateTime >= ${nameTable}.DateTime
            and tcd.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
            AND tcd.AgentSkillTargetID is not null
            AND tcd.TalkTime > 0
            AND tcd.CallDisposition in (13, 28)
            AND tcd.ANI = ${nameTable}.ANI
        ) >= 1
        then 0 --inbound
        WHEN
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
        ) >= 1
        then 0 -- outbound
        else 1
        END
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
       )TempTable
    `;
}

