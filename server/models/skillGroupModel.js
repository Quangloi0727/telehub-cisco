const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

exports.distinctTCD = async (db, dbMssql, query) => {
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

    let _query = `DECLARE @CT_IVR varchar(100);
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
    set @CT_ToAgentGroup1 = ${
      CT_ToAgentGroup1 || null
    }; -- Mã toAgent của skill group 1
    set @CT_ToAgentGroup2 = ${
      CT_ToAgentGroup2 || null
    }; -- Mã toAgent của skill group 2
    set @CT_ToAgentGroup3 = ${
      CT_ToAgentGroup3 || null
    }; -- Mã toAgent của skill group 3
    set @CT_Queue1 = ${CT_Queue1 || null}; -- Mã queue của skill group 1
    set @CT_Queue2 = ${CT_Queue2 || null}; -- Mã queue của skill group 2
    set @CT_Queue3 = ${CT_Queue3 || null}; -- Mã queue của skill group 3
    
    -- Ngày bắt đầu query
    set @startDate = '${startDate}';
    -- Ngày kết thúc query
    set @endDate = '${endDate}';

    Select * from  [ins1_awdb].[dbo].[t_Skill_Group] SG

    where SG.SkillTargetID in (
      Select DISTINCT SkillGroupSkillTargetID FROM [ins1_hds].[dbo].[t_Termination_Call_Detail]
      where 
      DateTime >= @startDate
      and DateTime < @endDate
      and CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
      and SkillGroupSkillTargetID is not null
    )`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};
