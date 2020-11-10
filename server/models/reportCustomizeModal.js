const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT, TYPE_MISSCALL, TYPE_CALL_HANDLE } = require("../helpers/constants");
const {
  checkKeyValueExists,
  reasonToTelehub,
  variableSQL,
} = require("../helpers/functions");


/**
 * API lấy dữ liệu chi tiết cuộc gọi nhỡ
 * Trang telehub: BÁO CÁO GỌI VÀO - CUỘC GỌI BỊ NHỠ THEO KHÁCH HÀNG: Tìm kiếm tổng quát
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.lastTCDRecord = async (db, dbMssql, query) => {
  try {
    let {
      pages,
      rows,
      paging,
      download,
      rawData,
      skillGroups,
    } = query;
    let querySelect = "";
    let queryCondition = "";

    querySelect = `${selectCallDetailByCustomer(query)}`;
    queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber`;
        

    let _query = `/**
      Mô tả:
        - Start: 01/11/2020
        - Detail: chi tiết dữ liệu cuộc gọi nhỡ theo, hiện tại chạy đúng theo từng ngày, chạy theo nhiều ngày thì phải test thêm
        - đã test chạy được theo query nhiều ngày
      */
    
      ${variableSQL(query)}
      
      WITH t_TCD_last AS (
        SELECT  ROW_NUMBER() OVER (PARTITION BY  RouterCallKeyDay, RouterCallKey ORDER BY RouterCallKeySequenceNumber DESC, RecoveryKey DESC) AS rn
        ,*
        FROM [ins1_hds].[dbo].[t_Termination_Call_Detail] as m
        where DateTime >= @startDate
        AND DateTime < @endDate
        AND CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
      )
      ${querySelect}
      ${queryCondition}`;

   
    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

function selectCallDetailByCustomer(query) {
  let {
    CT_IVR,
    CT_ToAgentGroup1,
    CT_ToAgentGroup2,
    CT_ToAgentGroup3,
    CT_Queue1,
    CT_Queue2,
    CT_Queue3,
    SG_Voice_1,
    SG_Voice_2,
    SG_Voice_3,
    skillGroups,
  } = query;
  // CT-5016
  let conditionFilter = ``;
  if(skillGroups){
    skillGroups = skillGroups.split(",")
    let filterIVR = skillGroups.filter(i => i.includes("CT"));
    let filterSG = skillGroups.filter(i => !i.includes("CT"));
    let CallTypeIDFilter = []
    if(filterSG.includes(SG_Voice_1)) CallTypeIDFilter = [ ...CallTypeIDFilter, ...[CT_ToAgentGroup1, CT_Queue1] ];
    if(filterSG.includes(SG_Voice_2)) CallTypeIDFilter = [ ...CallTypeIDFilter, ...[CT_ToAgentGroup2, CT_Queue2] ];
    if(filterSG.includes(SG_Voice_3)) CallTypeIDFilter = [ ...CallTypeIDFilter, ...[CT_ToAgentGroup3, CT_Queue3] ];
    
    if(filterIVR.length > 0 && filterSG.length > 0) {

      conditionFilter = `and CallTypeID in (@CT_IVR, ${CallTypeIDFilter})`
    }else if(filterIVR.length > 0) {
      conditionFilter = `and CallTypeID in (@CT_IVR)
                         AND AgentSkillTargetID is null`
    }else if(filterSG.length > 0) {
      

      conditionFilter = `
      And (CallTypeID in (${CallTypeIDFilter})
        and SkillGroupSkillTargetID in (${filterSG})
        or (
          CallTypeID in (${CallTypeIDFilter})
          and SkillGroupSkillTargetID is null 
        )
      )`
    }
  }
  return `SELECT
      case 
        when 
          CallTypeID = @CT_IVR
          and CallDisposition	= 13
          then '${reasonToTelehub(TYPE_MISSCALL.MissIVR)}'
        when 
          CallTypeID in (@CT_Queue1, @CT_Queue2, @CT_Queue3)
          and CallDisposition	in (13)
          AND AgentSkillTargetID is null
          then '${reasonToTelehub(TYPE_MISSCALL.MissQueue)}'
        when 
          CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3)
          and CallDisposition	in (3)
          then '${reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)}'
        when 
          CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
          and CallDisposition	in (19)
          then '${reasonToTelehub(TYPE_MISSCALL.MissAgent)}'
        when 
          CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
          and CallDisposition	in (60)
          then '${reasonToTelehub(TYPE_MISSCALL.RejectByAgent)}'
        when 
          CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
          AND AgentSkillTargetID is not null
          AND TalkTime >= 0
          AND CallDisposition	in (13)
          then '${reasonToTelehub(TYPE_CALL_HANDLE)}'
        when 
          CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
          AND AgentSkillTargetID is not null
          AND TalkTime >= 0
          AND CallDisposition	in (6,7)
          then '${reasonToTelehub(TYPE_MISSCALL.MissShortCall)}'
        
      else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
      end CallTypeTXT
      ${fieldCallTCD()}
  FROM t_TCD_last 
  left join [ins1_awdb].[dbo].[t_Skill_Group] SG
    on t_TCD_last.SkillGroupSkillTargetID = SG.SkillTargetID
      or(t_TCD_last.SkillGroupSkillTargetID is null
      and t_TCD_last.CallTypeID in (@CT_ToAgentGroup1, @CT_Queue1) and SG.SkillTargetID = @SG_Voice_1)
      or(t_TCD_last.SkillGroupSkillTargetID is null
      and t_TCD_last.CallTypeID in (@CT_ToAgentGroup2, @CT_Queue2) and SG.SkillTargetID = @SG_Voice_2)
      or(t_TCD_last.SkillGroupSkillTargetID is null
      and t_TCD_last.CallTypeID in (@CT_ToAgentGroup3, @CT_Queue3) and SG.SkillTargetID = @SG_Voice_3)
  WHERE rn = 1
    ${conditionFilter}
    `;
}

function fieldCallTCD() {
  return `
  ,RecoveryKey
  ,RouterCallKeySequenceNumber
  ,CallTypeID
  ,RouterCallKey
  ,AgentSkillTargetID
  ,[DateTime]
  ,[RingTime]
  ,[TalkTime]
  ,[Duration]
  ,[DelayTime]
  ,[TimeToAband]
  ,[HoldTime]
  ,[WorkTime]
  ,CallDisposition
  ,ANI
  ,TimeZone
  ,StartDateTimeUTC
  ,SG.EnterpriseName EnterpriseName
  ,case
		when SkillGroupSkillTargetID is null
			and CallTypeID in (@CT_ToAgentGroup1, @CT_Queue1)
			then @SG_Voice_1
		when SkillGroupSkillTargetID is null
			and CallTypeID in (@CT_ToAgentGroup2, @CT_Queue2)
			then @SG_Voice_2
		when SkillGroupSkillTargetID is null
			and CallTypeID in (@CT_ToAgentGroup3, @CT_Queue3)
			then @SG_Voice_3
		else SkillGroupSkillTargetID
	end SkillGroupSkillTargetID`
}