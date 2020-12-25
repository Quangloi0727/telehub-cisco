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

            set @SG_Voice_1 = ${
              SG_Voice_1 || null
            }; -- Mã queue của skill group 1
            set @SG_Voice_2 = ${
              SG_Voice_2 || null
            }; -- Mã queue của skill group 2
            set @SG_Voice_3 = ${
              SG_Voice_3 || null
            }; -- Mã queue của skill group 3

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
  Object.keys(variables).forEach((item) => {
    let currentValues = variables[item];

    if (
      item.includes("startDate") ||
      item.includes("endDate") ||
      item.includes("SG") ||
      item.includes("CT")
    ) {
      DECLARE.push(`DECLARE @${item} varchar(100);
      `);

      if (item.includes("startDate") || item.includes("endDate")) {
        SET_VALUE.push(`set @${item} = '${currentValues || null}';
        `);
      } else {
        SET_VALUE.push(`set @${item} = ${currentValues || null};
        `);
      }
    }
  });

  return `${DECLARE.join("")}
          ${SET_VALUE.join("")}`;
};

/**
 * Định nghĩa các biến theo call type dùng cho việc tổng hợp các báo cáo, query cisco
 */
exports.callTypeDynamic = (query) => {
  let CT_ToAgent_Dynamic = [];
  let CT_Queue_Dynamic = [];
  let CT_IVR_Dynamic = [];
  let CT_Tranfer_Dynamic = [];

  Object.keys(query).forEach((item) => {
    const element = query[item];
    if (item.includes("CT_ToAgentGroup")) {
      CT_ToAgent_Dynamic.push(`@${item}`);
    }

    if (item.includes("CT_Queue")) {
      CT_Queue_Dynamic.push(`@${item}`);
    }

    if (item.includes("CT_IVR")) {
      CT_IVR_Dynamic.push(`@${item}`);
    }
    if (item.includes("CT_Tranfer")) {
      CT_Tranfer_Dynamic.push(`@${item}`);
    }
  });

  return {
    CT_ToAgent_Dynamic,
    CT_Tranfer_Dynamic,
    CT_Queue_Dynamic,
    CT_IVR_Dynamic,
    CT_JOIN_FULL_Dynamic: [], // chưa chắc chắn vì có cả tranfer, join ToAgent và ToQueue và IVR
    CT_JOIN_All_Dynamic: [...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic, ...CT_IVR_Dynamic], // HAY DÙNG: join ToAgent và ToQueue và IVR
    CT_JOIN_Dynamic: [...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic], // Chỉ join ToAgent và ToQueue
  };
};
