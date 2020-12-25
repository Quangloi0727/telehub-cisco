const TYPE_ADS = {
    google: {
        number: 0,
        text: "Google",
    },
    local: {
        number: 1,
        text: "Ảnh từ hệ thống",
    }
};
/**
 * Message define telehub
    "TXT_TYPE_1": "KH dập máy khi nghe IVR",
    "TXT_TYPE_2": "KH dập máy khi đang ring agent",
    "TXT_TYPE_3": "ĐTV không nhấc máy",
    "TXT_TYPE_4": "ĐTV reject",
    "TXT_TYPE_5": "Tất cả ĐTV đều bận",
    "TXT_TYPE_OTHER": "Lý do khác",
 */
const TYPE_MISSCALL = {
    MissIVR: {
        value: 1,
        id: "MissIVR",
    },
    CustomerEndRinging: {
        value: 2,
        id: "CustomerEndRinging",
    },
    MissAgent: {
        value: 3,
        id: "MissAgent",
    },
    RejectByAgent: {
        value: 4,
        id: "RejectByAgent",
    },
    MissQueue: {
        value: 5,
        id: "MissQueue",
    },
    MissShortCall: {
        value: 8,
        id: "MissShortCall", // các cuộc agent nhấc máy nhưng duration < 5s (5s ko chắc) và callDiposition = 7 | 6
    },
    Other: {
        value: 6,
        id: "OTHER",
    },
};

const TYPE_CALL_HANDLE = {
    value: 7,
    id: "HandleByAgent",
};

const TYPE_CALLTYPE = {
    CT_ToAgentGroup: "CT_ToAgentGroup",
    CT_Queue: "CT_Queue",
    CT_IVR: "CT_IVR",
    CT_Tranfer: "CT_Tranfer",
    unknown: "unknown",
};

module.exports = {
    TYPE_ADS,
    TYPE_MISSCALL,
    TYPE_CALL_HANDLE,
    TYPE_CALLTYPE
};
