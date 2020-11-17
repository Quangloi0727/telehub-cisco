// const { DAU_CACH } = require("../constants");

/**
 * Định nghĩa các biến theo call type dùng cho việc tổng hợp các báo cáo, query cisco
 */
exports.variableSQL = (variables) => {
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
    SG_Voice_1,
    SG_Voice_2,
    SG_Voice_3,
    CT_Tranfer,
  } = variables;

  return `DECLARE @CT_IVR varchar(100);
            DECLARE @CT_ToAgentGroup1 varchar(100);
            DECLARE @CT_ToAgentGroup2 varchar(100);
            DECLARE @CT_ToAgentGroup3 varchar(100);
            DECLARE @CT_Queue1 varchar(100);
            DECLARE @CT_Queue2 varchar(100);
            DECLARE @CT_Queue3 varchar(100);
            DECLARE @CT_Tranfer varchar(100);
            
            DECLARE @SG_Voice_1 varchar(100);
            DECLARE @SG_Voice_2 varchar(100);
            DECLARE @SG_Voice_3 varchar(100);
            
            DECLARE @startDate varchar(100);
            DECLARE @endDate varchar(100);
            
            -- Định nghĩa CallType cho các chặng cuộc gọi có trong hệ thống
            set @CT_IVR = ${CT_IVR || null}; -- Mã toAgent của skill group 1
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

            set @CT_Tranfer = ${CT_Tranfer || null}; -- Mã CT_Tranfer

            set @SG_Voice_1 = ${SG_Voice_1 || null}; -- Mã queue của skill group 1
            set @SG_Voice_2 = ${SG_Voice_2 || null}; -- Mã queue của skill group 2
            set @SG_Voice_3 = ${SG_Voice_3 || null}; -- Mã queue của skill group 3

            -- Ngày bắt đầu query
            set @startDate = '${startDate}';
            -- Ngày kết thúc query
            set @endDate = '${endDate}';`;
};



/**
 * Định nghĩa các biến theo call type dùng cho việc tổng hợp các báo cáo, query cisco
 */
exports.variableSQLDynamic = (variables) => {
  let DECLARE = [];
  let SET_VALUE = [];
  Object.keys(variables).forEach(item => {
    let currentValues = variables[item];

    if(
      item.includes("startDate") ||
      item.includes("endDate") ||
      item.includes("SG") ||
      item.includes("CT")
      ){
      DECLARE.push(`DECLARE @${item} varchar(100);`);

      if(
        item.includes("startDate") ||
        item.includes("endDate")
      ) {
        SET_VALUE.push(`set @${item} = '${currentValues || null}';`);
      } else {
        SET_VALUE.push(`set @${item} = ${currentValues || null};`);
      }
    }
  });

  return `${DECLARE.join('')}
          ${SET_VALUE.join('')}`;
};
