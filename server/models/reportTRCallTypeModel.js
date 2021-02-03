const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB,DB_RECORDING } = process.env;

const { FIELD_AGENT, TYPE_CALLTYPE } = require("../helpers/constants");
const {
  checkKeyValueExists,
  variableSQL,
  variableSQLDynamic,
  callTypeDynamic,
} = require("../helpers/functions");

/**
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-13 00:00:00'
 *   , endDate: '2020-10-13 23:59:59'
 *   , callTypeID: '5014'
 *    }
 */
exports.realtime = realtime;

exports.getAll = async (db, dbMssql, query) => {
  try {
    let _query = `
    ${variableSQL(query)}
    SET ANSI_WARNINGS OFF SET ARITHABORT OFF SET ARITHIGNORE ON SET ANSI_NULLS ON SET ANSI_PADDING ON SET CONCAT_NULL_YIELDS_NULL ON SET QUOTED_IDENTIFIER ON SET NUMERIC_ROUNDABORT OFF 
    SELECT datetime= CTSG.DateTime,
            Date		 = CONVERT(char(10),CTSG.DateTime,101),
           calltypeId= CTSG.CallTypeID,
           skillgroupId=CTSG.SkillGroupSkillTargetID,
           precisionqueueId=CTSG.PrecisionQueueID,
           calltypeName= Call_Type.EnterpriseName,
           skillgroupName = CTSG.SGEnterpriseName,
           timeZone=CTSG.TimeZone,
           --recoveryKey= CTSG.RecoveryKey,
           answerWaitTime=sum(isnull(CTSG.AnswerWaitTime,0)),
           avgRouterDelayQ=sum(isnull(CTSG.RouterQueueWaitTime,0)) / sum(isnull(CTSG.RouterQueueCalls,0)),
           callDelayAbandTime= sum(isnull(CTSG.CallDelayAbandTime,0)),
           callsAnswered= sum(isnull( CTSG.CallsAnswered,0)),
           callsHandled= sum(isnull(CTSG.CallsHandled,0)),
           callsReportAgainstOther=sum(isnull(CTSG.CallsReportAgainstOther,0)),
           callsQHandled=sum(isnull( CTSG.CallsQHandled,0)),
           callsRona= sum(isnull(CTSG.CallsRONA,0)),
           callsRequired= sum(isnull(CTSG.CallsRequeried,0)),
           callsRoutedNonAgent= sum(isnull(CTSG.CallsRoutedNonAgent,0)),
           callsHandledNotRouted=sum(isnull(CTSG.CallsHandledNotRouted,0)),
           delayAgentAbandTime= sum(isnull(CTSG.DelayAgentAbandTime,0)),
           delayQAbandTime = sum(isnull(CTSG.DelayQAbandTime,0)),
           handleTime= sum(isnull(CTSG.HandleTime,0)),
           talkTime= sum(isnull(CTSG.TalkTime,0)),
           holdTime= sum(isnull(CTSG.HoldTime,0)),
           incompleteCalls=sum(isnull(CTSG.IncompleteCalls,0)),
           callsOfferedRouted=sum(isnull(CTSG.CallsOfferedRouted,0)),
           callsOfferedNotRouted=sum(isnull(CTSG.CallsOfferedNotRouted,0)),
           routerCallsAbandQ= sum(isnull(CTSG.RouterCallsAbandQ,0)),
           routerCallsAbandToAgent=sum(isnull(CTSG.RouterCallsAbandToAgent,0)),
           routerQueueWaitTime=sum(isnull(CTSG.RouterQueueWaitTime,0)),
           routerQueueCalls=sum(isnull(CTSG.RouterQueueCalls,0)),      
           routerCallsDequeued=sum(isnull(CTSG.RouterCallsDequeued,0)),
           shortCalls=sum(isnull(CTSG.ShortCalls,0)),
           agentErrorCount=sum(isnull(CTSG.AgentErrorCount,0)),
           errorCount=sum(isnull(CTSG.ErrorCount,0)),
           serviceLevelAband=sum(isnull(CTSG.ServiceLevelAband,0)),
           serviceLevelCalls=sum(isnull(CTSG.ServiceLevelCalls,0)),
           serviceLevelCallsOffered=sum(isnull(CTSG.ServiceLevelCallsOffered,0)),
          DoNotUseSLTop = CASE min(isnull(CTSG.ServiceLevelType,0))
                         WHEN 1 THEN sum(isnull(CTSG.ServiceLevelCalls,0)) * 1.0 
                         WHEN 2 THEN sum(isnull(CTSG.ServiceLevelCalls,0)) * 1.0
                         WHEN 3 THEN (sum(isnull(CTSG.ServiceLevelCalls,0)) + sum(isnull(CTSG.ServiceLevelAband,0))) * 1.0 
                         ELSE 0 END,
           DoNotUseSLBottom = CASE min(isnull(CTSG.ServiceLevelType,0))
                         WHEN 1 THEN CASE WHEN (sum(isnull(CTSG.ServiceLevelCallsOffered,0)) - sum(isnull(CTSG.ServiceLevelAband,0))) <= 0 THEN 0 ELSE (sum(isnull(CTSG.ServiceLevelCallsOffered,0)) - sum(isnull(CTSG.ServiceLevelAband,0))) END
                         WHEN 2 THEN (sum(isnull(CTSG.ServiceLevelCallsOffered,0)))
                         WHEN 3 THEN (sum(isnull(CTSG.ServiceLevelCallsOffered,0)))
                         ELSE 0 END,
          servicelLevel=CASE min(isnull(CTSG.ServiceLevelType,0))
                         WHEN 1 THEN (CASE WHEN (sum(isnull(CTSG.ServiceLevelCallsOffered,0)) - sum(isnull(CTSG.ServiceLevelAband,0))) <= 0 THEN 0
                                            ELSE sum(isnull(CTSG.ServiceLevelCalls,0)) * 1.0 /
                                    (sum(isnull(CTSG.ServiceLevelCallsOffered,0)) - sum(isnull(CTSG.ServiceLevelAband,0)))END)
                         WHEN 2 THEN (CASE WHEN (sum(isnull(CTSG.ServiceLevelCallsOffered,0))) <= 0 THEN 0
                                            ELSE sum(isnull(CTSG.ServiceLevelCalls,0)) * 1.0 /
                                    (sum(isnull(CTSG.ServiceLevelCallsOffered,0)))END)
                         WHEN 3 THEN (CASE WHEN (sum(isnull(CTSG.ServiceLevelCallsOffered,0))) <= 0 THEN 0
                                            ELSE (sum(isnull(CTSG.ServiceLevelCalls,0)) + sum(isnull(CTSG.ServiceLevelAband,0))) * 1.0 /
                                    (sum(isnull(CTSG.ServiceLevelCallsOffered,0)))END)
                         ELSE 0 END,
           serviceLevelError=sum(isnull(CTSG.ServiceLevelError,0)),
           serviceLevelRONA= sum(isnull(CTSG.ServiceLevelRONA,0)),
           serviceLevelType= min(isnull(CTSG.ServiceLevelType,0)),
           serviceLevelCallsDequeue = sum(isnull(CTSG.ServiceLevelCallsDequeue,0)),
           dbdatetime=CTSG.DbDateTime,
           callsonhold=sum(isnull(CTSG.CallsOnHold,0)),
           routerCallsAbandDequeued=sum(isnull(CTSG.RouterCallsAbandDequeued,0)),
           maxHoldTime=MAX(isnull(CTSG.MaxHoldTime,0)),
           overflowOut=sum(isnull(CTSG.OverflowOut,0)),
           perQueued=case when sum(isnull(CTSG.CallsHandled,0)) = 0 then 0 else (sum(isnull( CTSG.CallsQHandled,0)) * 1.0 /sum(isnull(CTSG.CallsHandled,0))) end ,
           avgHoldTime= case when sum(isnull(CTSG.CallsOnHold,0))=0 then 0 
                        else (sum(isnull(CTSG.HoldTime,0)) / sum(isnull(CTSG.CallsOnHold,0))) end,       
           aat= case when sum(isnull(CTSG.CallsHandled,0))=0 then 0
                else (sum(isnull(CTSG.TalkTime,0))/ sum(isnull(CTSG.CallsHandled,0))) end,
           aht= case when  sum(isnull(CTSG.CallsHandled,0))=0 then 0
                else (sum(isnull(CTSG.HandleTime,0))/ sum(isnull(CTSG.CallsHandled,0))) end,
           asa= case when sum(isnull(CTSG.CallsAnswered,0))=0 then 0
                else (sum(isnull(CTSG.AnswerWaitTime,0))/ sum(isnull(CTSG.CallsAnswered,0))) end,
    avgAbanTime =  case when  sum(isnull(CTSG.RouterCallsAbandQ,0))=0 then 0
    else  (sum(isnull(CTSG.CallDelayAbandTime,0))/ sum(isnull(CTSG.RouterCallsAbandQ,0))) end,
            AvgACWTime =case when sum(isnull(CTSG.CallsHandled,0)) = 0 then 0 
                else (sum(isnull(CTSG.HandleTime,0))-sum(isnull(CTSG.TalkTime,0))-sum(isnull(CTSG.HoldTime,0)))/sum(isnull(CTSG.CallsHandled,0)) end,		
           reportingHalfHour=CTSG.ReportingHalfHour,
           reportingInterval=CTSG.ReportingInterval,
           MaxCallsQueued=Max(CTSG.MaxCallsQueued),
           MaxCallWaitTime=Max(CTSG.MaxCallWaitTime)
      FROM Call_Type (nolock), 
        (Select Call_Type_SG_Interval.*, SGEnterpriseName = SG.EnterpriseName, SGSkillTargetID = SG.SkillTargetID, Media = Media_Routing_Domain.EnterpriseName 
           FROM Call_Type_SG_Interval(nolock), 
                Media_Routing_Domain(nolock),
                Skill_Group SG (nolock) 
           WHERE SG.SkillTargetID = Call_Type_SG_Interval.SkillGroupSkillTargetID
            AND SG.MRDomainID = Media_Routing_Domain.MRDomainID
            AND (SG.SkillTargetID NOT IN (SELECT BaseSkillTargetID FROM Skill_Group (nolock) WHERE (Priority > 0) AND (Deleted <> 'Y')))
            AND Call_Type_SG_Interval.DateTime >= @startDate
            AND Call_Type_SG_Interval.DateTime < @endDate
            AND Call_Type_SG_Interval.CallTypeID IN (@CT_ToAgentGroup1,@CT_ToAgentGroup2,@CT_ToAgentGroup3, @CT_Queue1,@CT_Queue2,@CT_Queue3)
        UNION ALL
          Select Call_Type_SG_Interval.*, SGEnterpriseName = Precision_Queue.EnterpriseName, SGSkillTargetID = SG.SkillTargetID, Media = Media_Routing_Domain.EnterpriseName 
            FROM Call_Type_SG_Interval(nolock), 
                 Media_Routing_Domain(nolock), 
                 Precision_Queue(nolock),
                            (Select DISTINCT 
                        EnterpriseName = Case When Skill_Group.PrecisionQueueID IS NULL Then Skill_Group.EnterpriseName Else SGPQ.EnterpriseName END, 
                        SkillTargetID = Case When Skill_Group.PrecisionQueueID IS NULL Then Skill_Group.SkillTargetID Else SGPQ.SkillTargetID END, 
                        PrecisionQueueID = CASE WHEN Skill_Group.PrecisionQueueID IS NULL Then NULL ELSE SGPQ.PrecisionQueueID END,
                        MRDomainID
                   FROM Skill_Group (nolock) 
                   LEFT JOIN (Select EnterpriseName = MIN(EnterpriseName),  
                                     SkillTargetID = MIN(SkillTargetID), 
                                     PrecisionQueueID 
                                FROM Skill_Group (nolock)  
                               Where PrecisionQueueID IS NOT NULL
                            Group By PrecisionQueueID 
                            ) SGPQ ON Skill_Group.PrecisionQueueID = SGPQ.PrecisionQueueID
                )SG
           WHERE SG.PrecisionQueueID = Call_Type_SG_Interval.PrecisionQueueID
            AND SG.PrecisionQueueID = Precision_Queue.PrecisionQueueID
            AND SG.MRDomainID = Media_Routing_Domain.MRDomainID
            AND Call_Type_SG_Interval.DateTime >= @startDate
            AND Call_Type_SG_Interval.DateTime < @endDate
            AND Call_Type_SG_Interval.CallTypeID IN (@CT_ToAgentGroup1,@CT_ToAgentGroup2,@CT_ToAgentGroup3, @CT_Queue1,@CT_Queue2,@CT_Queue3)) CTSG
    
     Where  Call_Type.CallTypeID = CTSG.CallTypeID
    GROUP BY 
        CTSG.CallTypeID, 
        Call_Type.EnterpriseName, 
        CTSG.DateTime,
        CTSG.SkillGroupSkillTargetID,
        CTSG.PrecisionQueueID,
        CTSG.SGEnterpriseName,
        CTSG.TimeZone,
        CTSG.DbDateTime,
        CTSG.ReportingHalfHour,
        CTSG.ReportingInterval
    ORDER BY Call_Type.EnterpriseName, 
        CTSG.SGEnterpriseName,
        CTSG.DateTime
    `;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

async function realtime(db, dbMssql, query) {
  try {
    let {
      CT_JOIN_All_Dynamic,
      CT_ToAgent_Dynamic,
      CT_Tranfer_Dynamic,
      CT_Queue_Dynamic,
      CT_IVR_Dynamic,
    } = callTypeDynamic(query);

    let _query = `
       ${variableSQLDynamic(query)}
      
       SELECT ${fieldCallTypeRealTime(
         CT_ToAgent_Dynamic,
         CT_Tranfer_Dynamic,
         CT_Queue_Dynamic,
         CT_IVR_Dynamic
       )}
       FROM [${DB_AWDB}].[dbo].[t_Call_Type_Real_Time]
       where
          CallTypeID in (${CT_JOIN_All_Dynamic.join(",")})`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
}

function fieldCallTypeRealTime(
  CT_ToAgent_Dynamic,
  CT_Tranfer_Dynamic,
  CT_Queue_Dynamic,
  CT_IVR_Dynamic
) {
  return `[CallTypeID]
     ,[DateTime]
     ,[RouterCallsQNow]
     ,[RouterCallsQNowTime]
     ,CallTypeDefined = CASE
        WHEN [CallTypeID] in (${CT_ToAgent_Dynamic.join(",")})
			    THEN '${TYPE_CALLTYPE.CT_ToAgentGroup}'
        WHEN [CallTypeID] in (${CT_Queue_Dynamic.join(",")})
          THEN '${TYPE_CALLTYPE.CT_Queue}'
        WHEN [CallTypeID] in (${CT_IVR_Dynamic.join(",")})
          THEN '${TYPE_CALLTYPE.CT_IVR}'
        WHEN [CallTypeID] in (${CT_Tranfer_Dynamic.join(",")})
          THEN '${TYPE_CALLTYPE.CT_Tranfer}'
            ELSE '${TYPE_CALLTYPE.unknown}' END
     ,[AvgRouterDelayQHalf]
     ,[AvgRouterDelayQNow]
     ,[AvgRouterDelayQTo5]
     ,[AvgRouterDelayQToday]
     ,[CallsRoutedToday]
     ,[CallsRoutedToHalf]
     ,[ErrorCountToday]
     ,[ErrorCountToHalf]
     ,[ICRDefaultRoutedToday]
     ,[ICRDefaultRoutedToHalf]
     ,[MasterScriptID]
     ,[NetworkDefaultRoutedToday]
     ,[NetworkDefaultRoutedToHalf]
     ,[ReturnBusyToday]
     ,[ReturnBusyToHalf]
     ,[ReturnRingToday]
     ,[ReturnRingToHalf]
     ,[RouterCallsAbandQHalf]
     ,[RouterCallsAbandQTo5]
     ,[RouterCallsAbandQToday]

     ,[RouterLongestCallQ]
     ,[RouterQueueCallsHalf]
     ,[RouterQueueCallsTo5]
     ,[RouterQueueCallsToday]
     ,[RouterQueueWaitTimeHalf]
     ,[RouterQueueWaitTimeTo5]
     ,[RouterQueueWaitTimeToday]
     ,[ScriptID]
     ,[NetworkAnnouncementToHalf]
     ,[NetworkAnnouncementToday]
     ,[AnswerWaitTimeTo5]
     ,[CallsHandledTo5]
     ,[CallsLeftQTo5]
     ,[CallsOfferedTo5]
     ,[DelayQAbandTimeTo5]
     ,[HandleTimeTo5]
     ,[ServiceLevelAbandTo5]
     ,[ServiceLevelCallsOfferedTo5]
     ,[ServiceLevelCallsTo5]
     ,[ServiceLevelTo5]
     ,[TalkTimeTo5]
     ,[ServiceLevelCallsQHeld]
     ,[AnswerWaitTimeToday]
     ,[CallsHandledToday]
     ,[CallsOfferedToday]
     ,[HandleTimeToday]
     ,[ServiceLevelAbandToday]
     ,[ServiceLevelCallsOfferedToday]
     ,[ServiceLevelCallsToday]
     ,[ServiceLevelToday]
     ,[TalkTimeToday]
     ,[AnswerWaitTimeHalf]
     ,[CallsHandledHalf]
     ,[CallsOfferedHalf]
     ,[HandleTimeHalf]
     ,[ServiceLevelAbandHalf]
     ,[ServiceLevelCallsHalf]
     ,[ServiceLevelCallsOfferedHalf]
     ,[ServiceLevelHalf]
     ,[TalkTimeHalf]
     ,[HoldTimeTo5]
     ,[HoldTimeHalf]
     ,[HoldTimeToday]
     ,[OverflowOutHalf]
     ,[OverflowOutTo5]
     ,[OverflowOutToday]
     ,[DelayQAbandTimeToday]
     ,[DelayQAbandTimeHalf]
     ,[CallsAnsweredTo5]
     ,[CallsAnsweredHalf]
     ,[CallsAnsweredToday]
     ,[CallsRoutedNonAgentHalf]
     ,[CallsRoutedNonAgentToday]
     ,[CallsRONATo5]
     ,[CallsRONAHalf]
     ,[CallsRONAToday]
     ,[ReturnReleaseHalf]
     ,[ReturnReleaseToday]
     ,[CallsRoutedNonAgentTo5]
     ,[RouterCallsAbandToAgentTo5]
     ,[RouterCallsAbandToAgentHalf]
     ,[RouterCallsAbandToAgentToday]
     ,[TotalCallsAbandTo5]
     ,[TotalCallsAbandToday]
     ,[TotalCallsAbandHalf]
     ,[DelayAgentAbandTimeToday]
     ,[DelayAgentAbandTimeTo5]
     ,[DelayAgentAbandTimeHalf]
     ,[CallDelayAbandTimeToday]
     ,[CallDelayAbandTimeTo5]
     ,[CallDelayAbandTimeHalf]
     ,[CTDelayAbandTimeToday]
     ,[CTDelayAbandTimeTo5]
     ,[CTDelayAbandTimeHalf]
     ,[ServiceLevelErrorHalf]
     ,[ServiceLevelErrorToday]
     ,[ServiceLevelRONATo5]
     ,[ServiceLevelRONAHalf]
     ,[ServiceLevelRONAToday]
     ,[AgentErrorCountHalf]
     ,[AgentErrorCountToday]
     ,[CallsAtVRUNow]
     ,[CallsAtAgentNow]
     ,[ShortCallsToHalf]
     ,[ShortCallToday]`;
}
