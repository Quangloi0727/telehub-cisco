const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

/**
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-13 00:00:00'
 *   , endDate: '2020-10-13 23:59:59'
 *   , callTypeID: '5014'
 *   , callTypeTranferID: '5015'
 *    }
 *  2020/10/30: ko dùng nữa.
 */

exports.callDisposition = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      callTypeID,
      callTypeTranferID,
      callDisposition,
    } = query;
    let callTypeQuery = [callTypeID];

    let _query = `SELECT 
    CallDisposition
    ,Count(*) count
    ,Sum(case
      when CallDisposition = 13
      and Variable8 is not null
      and SkillGroupSkillTargetID is null
      and AgentSkillTargetID is null
      then 1
      else 0 end
    ) CallDisposition_13_not_agent
     FROM [ins1_awdb].[dbo].[Termination_Call_Detail]
     where
        DateTime >= '${startDate}'
        AND DateTime < '${endDate}'
        AND CallTypeID in (${callTypeQuery.join(",")})
        AND CallDisposition NOT IN (52)
        Group by CallDisposition`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};



/**
 * API lấy dữ liệu cuộc gọi nhỡ tổng hợp theo SkillGroup
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , callTypeTranferID: '5015'
 *    }
 */

exports.skillGroup = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      CT_IVR,
      CT_ToAgentGroup1,
      CT_ToAgentGroup2,
      CT_ToAgentGroup3,
      CT_Queue1,
      CT_Queue2,
      CT_Queue3,
    } = query;

    let _query = `/**
    Mô tả:
    - Start: 01/11/2020
    - Detail: tổng hợp dữ liệu cuộc gọi nhỡ theo Skill Group, hiện tại chạy đúng theo từng ngày, chạy theo nhiều ngày thì phải test thêm
    - đã test chạy được theo query nhiều ngày
  */
  
  DECLARE @CT_IVR varchar(100);
  DECLARE @CT_ToAgentGroup1 varchar(100);
  DECLARE @CT_ToAgentGroup2 varchar(100);
  DECLARE @CT_ToAgentGroup3 varchar(100);
  DECLARE @CT_Queue1 varchar(100);
  DECLARE @CT_Queue2 varchar(100);
  DECLARE @CT_Queue3 varchar(100);
  
  DECLARE @startDate varchar(100);
  DECLARE @endDate varchar(100);
  
  -- Định nghĩa CallType cho các chặng cuộc gọi có trong hệ thống
  set @CT_IVR = ${CT_IVR}; -- Mã toAgent của skill group 1
  set @CT_ToAgentGroup1 = ${CT_ToAgentGroup1}; -- Mã toAgent của skill group 1
  set @CT_ToAgentGroup2 = ${CT_ToAgentGroup2}; -- Mã toAgent của skill group 2
  set @CT_ToAgentGroup3 = ${CT_ToAgentGroup3}; -- Mã toAgent của skill group 3
  set @CT_Queue1 = ${CT_Queue1}; -- Mã queue của skill group 1
  set @CT_Queue2 = ${CT_Queue2}; -- Mã queue của skill group 2
  set @CT_Queue3 = ${CT_Queue3}; -- Mã queue của skill group 3
  
  -- Ngày bắt đầu query
  set @startDate = ${startDate};
  -- Ngày kết thúc query
  set @endDate = ${endDate};
  
  -- dùng bản tạm để lưu query, và sẽ xóa bảng này khi kết thúc phiên query ??? CÓ BỊ VẤN ĐỀ NẾU NHIỀU NGƯỜI CÙNG TRUY XUẤT BÁO CÁO KO NHỈ???
  IF OBJECT_ID('tempdb.dbo.#tempTCD') IS NOT NULL
      DROP TABLE #tempTCD;
  
  -- bảng lấy bản tin TCD của mỗi cuộc gọi
  WITH t_TCD_last AS (
    SELECT  ROW_NUMBER() OVER (PARTITION BY RouterCallKey ORDER BY RouterCallKey, RouterCallKeySequenceNumber DESC) AS rn
    ,*
    FROM [ins1_hds].[dbo].[t_Termination_Call_Detail] as m
    where DateTime >= @startDate
    and DateTime < @endDate
    and CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
  )
  -- query dữ liệu từ các bản tin cuối của mỗi cuộc gọi
  SELECT
    RecoveryKey as LastRecoveryKey
    ,RouterCallKey
    ,AgentSkillTargetID 
    ,SkillGroupSkillTargetID
    ,t_TCD_last.CallTypeID
    ,RouterCallKeySequenceNumber
    ,CallDisposition
    ,CASE WHEN 
        t_TCD_last.CallDisposition in (13)
        and t_TCD_last.AgentSkillTargetID is null
        and t_TCD_last.CallTypeID in (@CT_IVR)
        THEN 1 
        ELSE 0 
      END
      MissIVR -- Nhỡ trên IVR
    ,CASE WHEN 
        t_TCD_last.CallDisposition in (13)
        and t_TCD_last.AgentSkillTargetID is null
        and t_TCD_last.CallTypeID in (@CT_Queue1)
        THEN 1 
        ELSE 0 
      END
      MissQueueSG1 -- Nhỡ trên Queue từ SkillGroup1
      ,CASE WHEN 
        t_TCD_last.CallDisposition in (13)
        and t_TCD_last.AgentSkillTargetID is null
        and t_TCD_last.CallTypeID in (@CT_Queue2)
        THEN 1 
        ELSE 0 
      END
      MissQueueSG2 -- Nhỡ trên Queue từ SkillGroup2
      ,CASE WHEN 
        t_TCD_last.CallDisposition in (13)
        and t_TCD_last.AgentSkillTargetID is null
        and t_TCD_last.CallTypeID in (@CT_Queue3)
        THEN 1 
        ELSE 0 
      END
      MissQueueSG3 -- Nhỡ trên Queue từ SkillGroup3
    ,CASE WHEN 
        t_TCD_last.CallDisposition in (13)
        and t_TCD_last.AgentSkillTargetID is not null
        and t_TCD_last.CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
        THEN 1 
        ELSE 0 
      END
      handle
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
       t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (3)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup1)
    ) CustomerEndRingingSG1 -- KH dập máy (trước) khi đang ring đến SkillGroup1
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
       t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (3)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup2)
    ) CustomerEndRingingSG2 -- KH dập máy (trước) khi đang ring đến SkillGroup2
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
       t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (3)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup3)
    ) CustomerEndRingingSG3 -- KH dập máy (trước) khi đang ring đến SkillGroup3
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
        t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (19)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup1, @CT_Queue1)
    ) MissAgent1 -- Nhỡ trên SkillGroup1 (Agent ko  nghe máy)
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
        t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (19)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup2, @CT_Queue2)
    ) MissAgent2 -- Nhỡ trên SkillGroup2 (Agent ko  nghe máy)
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
       t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (19)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup3, @CT_Queue3)
    ) MissAgent3 -- Nhỡ trên SkillGroup3 (Agent ko  nghe máy)
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
        t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (60)
      and t_TCD.CallTypeID in (@CT_ToAgentGroup1, @CT_Queue1)
    ) RejectByAgentSG1 -- Agent SkillGroup1 từ chối cuộc gọi (Agent reject cuộc gọi)
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
        t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (60)
      and t_TCD.CallTypeID in ( @CT_ToAgentGroup2, @CT_Queue2)
    ) RejectByAgentSG2 -- Agent SkillGroup2 từ chối cuộc gọi (Agent reject cuộc gọi)
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
       t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.CallDisposition in (60)
      and t_TCD.CallTypeID in ( @CT_ToAgentGroup3, @CT_Queue3)
    ) RejectByAgentSG3 -- Agent SkillGroup3 từ chối cuộc gọi (Agent reject cuộc gọi)
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
        t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
      and t_TCD.AgentSkillTargetID is not null
      and(
        -- các cuộc gọi:
        -- 60: agent reject
        -- 19: agent ko nghe máy
        -- 3: KH dập máy (trước) khi đang ring đến SkillGroup
        t_TCD.CallDisposition in (60,19)
        and t_TCD.CallTypeID in ( @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
        or (
        t_TCD.CallDisposition in (3)
        and t_TCD.CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3)
        )
      )
    ) MissTotal -- tổng hợp các cuộc gọi nhỡ: CustomerEndRinging, MissAgent, Reject By agent
    ,(Select Count(*) from [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
      where 
       t_TCD.DateTime >= @startDate
      and t_TCD.DateTime < @endDate
      and t_TCD.CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
      and t_TCD.RouterCallKey = t_TCD_last.RouterCallKey
    ) CountTCD -- Đếm các bản tin TCD, hiện tại ko dùng
  INTO #tempTCD
  FROM t_TCD_last 
  WHERE rn = 1
  
  -- hiển thị chi tiết từng cuộc gọi, nếu muốn debug thì chạy dòng này
  --select * from #tempTCD
  
  select SkillGroupSkillTargetID
    ,Sum(MissIVR) MissIVR -- Nhỡ trên IVR
    ,Sum(CustomerEndRingingSG1) CustomerEndRingingSG1 -- KH dập máy (trước) khi đang ring đến SkillGroup1
    ,Sum(CustomerEndRingingSG2) CustomerEndRingingSG2 -- KH dập máy (trước) khi đang ring đến SkillGroup2
    ,Sum(CustomerEndRingingSG3) CustomerEndRingingSG3 -- KH dập máy (trước) khi đang ring đến SkillGroup3
    ,Sum(MissAgent1) MissAgent1 -- Nhỡ trên SkillGrou1 (Agent ko  nghe máy)
    ,Sum(MissAgent2) MissAgent2 -- Nhỡ trên SkillGroup2 (Agent ko  nghe máy)
    ,Sum(MissAgent3) MissAgent3 -- Nhỡ trên SkillGroup3 (Agent ko  nghe máy)
    ,Sum(RejectByAgentSG1) RejectByAgentSG1 -- Agent SkillGroup1 từ chối cuộc gọi (Agent reject cuộc gọi)
    ,Sum(RejectByAgentSG2) RejectByAgentSG2 -- Agent SkillGroup2 từ chối cuộc gọi (Agent reject cuộc gọi)
    ,Sum(RejectByAgentSG3) RejectByAgentSG3 -- Agent SkillGroup3 từ chối cuộc gọi (Agent reject cuộc gọi)
    ,Sum(ISNULL(MissQueueSG1, 0)) MissQueueSG1 -- Nhỡ trên Queue từ SkillGroup1
    ,Sum(ISNULL(MissQueueSG2, 0)) MissQueueSG2 -- Nhỡ trên Queue từ SkillGroup2
    ,Sum(ISNULL(MissQueueSG3, 0)) MissQueueSG3 -- Nhỡ trên Queue từ SkillGroup3
    ,Sum(MissTotal + MissQueueSG1 + MissQueueSG2 + MissQueueSG3 + MissIVR) MissTotal
    --,count(*) missCount
  from #tempTCD
  group by SkillGroupSkillTargetID
  
  -- xóa bảng này khi kết thúc phiên query
  DROP TABLE #tempTCD;`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};