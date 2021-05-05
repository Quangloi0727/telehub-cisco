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
      queryQueue += `Where TempTable2.SkillGroupSkillTargetID IN (${queue})`
    }
    if (status) {
      if (queryQueue != "") {
        queryStatus += `AND TempTable2.DIRECTION IN (${status})`
      } else {
        queryStatus += `WHERE TempTable2.DIRECTION IN (${status})`
      }
    }

    querySelect = `${selectCallDetailByCustomer(
      query,
      nameTableTCDLast
    )}`;
    if (rows) {
      queryPage = `
                OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY
            `;
    }
    _logger.log("info", `querySelect ${querySelect}`);
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
        ${parseInt(query.flag) != 3 ? "ORDER BY TempTable2.DateTime DESC" : ""}
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
  let when_dynamic = [];


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
      when_dynamic.push(`
            when SkillGroupSkillTargetID is null
            and CallTypeID in (@CT_ToAgentGroup${groupNumber}, @CT_Queue${groupNumber})
            then @SG_Voice_${groupNumber}
            `);
    }
  });

  switch (parseInt(query.flag)) {
    case 2:
      return `
            SELECT * from (
                SELECT TempTable.DateTime,TempTable.startTime,TempTable.ANI,TempTable.SkillGroupSkillTargetID,TalkTime
                FROM(
                    SELECT
                    [DateTime]
                    ,[Duration]
                    ,DATEADD(ss , -Duration, DateTime) AS startTime
                    ,[DigitsDialed]
                    ,[RecoveryKey]
                    ,[TalkTime]
                    ,CASE
                    ${when_dynamic.join("")}
                        else SkillGroupSkillTargetID
                    end SkillGroupSkillTargetID
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
                            AND t_TCD_handle.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")})
                            AND TalkTime > ${+query.talkTime}
                            AND CallDisposition in (13,28)
                        )
                    )
                ) TempTable ) TempTable2`;
    case 3:
      return `
            SELECT count(*) as totalPage from (
                SELECT TempTable.DateTime,TempTable.startTime,TempTable.ANI,TempTable.SkillGroupSkillTargetID,TalkTime
                FROM(
                    SELECT
                    [DateTime]
                    ,[Duration]
                    ,DATEADD(ss , -Duration, DateTime) AS startTime
                    ,[DigitsDialed]
                    ,[RecoveryKey]
                    ,[TalkTime]
                    ,CASE
                    ${when_dynamic.join("")}
                        else SkillGroupSkillTargetID
                    end SkillGroupSkillTargetID
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
                            AND t_TCD_handle.CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")})
                            AND TalkTime > ${+query.talkTime}
                            AND CallDisposition in (13,28)
                        )
                    )
                ) TempTable ) TempTable2`;
  }
}

