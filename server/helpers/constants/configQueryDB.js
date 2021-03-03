/**
 * ASC
 * DESC
 */
const TYPE_ASC = 1;
const TYPE_DESC = -1;

// sort cho kplus
// các key này rất quan trọng, mapping với cisco nên chỉnh sửa phải lưu ý

const WEIGHT_TEAM = {
    1900: {
        num: 1,
        text: 'INBOUND 1900',
    },
    1800: { // BACKEND
        num: 4,
        text: 'INBOUND 1800',
    },
    DIGITAL: {
        num: 3,
        text: 'DIGITAL',
    },
    OUTBOUND: {
        num: 2,
        text: 'OUTBOUND',
    },
    "Other": {
        num: 9999,
        text: 'Other',
    }
};

// sort cho kplus
const WEIGHT_STATE = {
    Ready: {
        num: 1,
        text: 'Ready',
    },
    Talking: {
        num: 2,
        text: 'Talking',
    },
    "Not Ready": {
        num: 3,
        text: 'Not Ready',
    },
    "AtLunch": {
        num: 4,
        text: 'AtLunch',
    },
    "Meeting": {
        num: 5,
        text: 'Meeting',
    },
    "NoAvailable": {
        num: 6,
        text: 'NoAvailable',
    },
    "NoACD": {
        num: 7,
        text: 'NoACD',
    },
    "Other": {
        num: 9999,
        text: 'Other',
    }
};

const WEIGHT_STATE_2 = {
    Ready: {
        num: 5,
        text: 'Ready',
    },
    Talking: {
        num: 2,
        text: 'Talking',
    },
    "Not Ready": {
        num: 1,
        text: 'Not Ready',
    },
    "AtLunch": {
        num: 3,
        text: 'AtLunch',
    },
    "Meeting": {
        num: 4,
        text: 'Meeting',
    },
    "NoAvailable": {
        num: 7,
        text: 'NoAvailable',
    },
    "NoACD": {
        num: 6,
        text: 'NoACD',
    },
    "Other": {
        num: 9999,
        text: 'Other',
    }
};

module.exports = {
    SORT: {
        BY_DEFAULT: 'count',
        TYPE_DEFAULT: TYPE_ASC,
    },
    TYPE_ASC,
    TYPE_DESC,
    WEIGHT_TEAM,
    WEIGHT_STATE,
    WEIGHT_STATE_2
}