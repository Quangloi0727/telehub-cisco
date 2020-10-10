module.exports = {
    FIELD_CATEGORY: {
        getName: {
            name: "tên",
            code: "mã",
            list: "danh sách",
        },
        require: ["name", "list"],
        checkExists: ["name", "code"],
        charName: "DM",
    },
    FIELD_PRODUCT: {
        getName: {
            category_id: "danh mục",
            name: "tên",
            code: "mã",
            barcode: "mã số GTIN",
            sku: "mã số GTIN 2", //
            image: "ảnh",
            unit_list: "đơn vị",
            expried_date: "ngày hết hạn",
            description: "mô tả",
            supplier_id: "nhà cung cấp", // optional: nếu sp được cung cấp riêng của NCC
            // base_price: 'giá cơ bản',
        },
        require: ["name", "barcode", "unit_list", "category_id"],
        checkExists: ["name", "code", "barcode"],
        charName: "SP",
    },
    FIELD_PURCHASE: {
        getName: {
            products: [
                {
                    product_id: "product_id",
                    unit_name: "đơn vị",
                    price: "giá nhập",
                    quantity: "số lượng",
                    sold_out: "bán hết", // T/F
                },
            ],
            code: "mã", // update trên server
            supplier_id: "nhà cung cấp", // cho chọn
            createdBy_id: "người tạo", // tạm thời fix
            created_date: "ngày tạo", // tạm thời để trên server
            status: "trạng thái",
            total: "tổng tiền",
        },
        require: ["products", "supplier_id", "total"],
        checkExists: ["code"],
        charName: "PN",
    },
    FIELD_INVOICE: {
        getName: {
            products: [
                {
                    product_id: "product_id",
                    unit_name: "đơn vị",
                    price: "giá sản phẩm",
                    quantity: "số lượng",
                    total: "tổng tiền",
                },
            ],
            code: "mã hóa đơn", // update trên server
            customer_id: "khách hàng",
            soldBy_id: "người bán", // người xác nhận hóa đơn ở trạng thái nợ / hoàn thành
            createdBy_id: "người tạo", // userID người tạo
            created_date: "ngày tạo", //
            status: "trạng thái", // 0: nháp, 1: nợ, 2: hoàn thành
            total: "tổng tiền",
            total_payment: "tổng thanh toán",
            total_payment_old: "tổng thanh toán cũ",
        },
        require: [
            "products",
            // "customer_id",
            // "soldBy_id",
            // "createdBy_id",
            "total",
        ],
        checkExists: ["code"],
        charName: "HD",
    },
    FIELD_PAYMENT: {
        getName: {
            invoice_id: "hóa đơn",
            code: "mã thanh toán",
            amount: "tiền thu", // tiền thu của hóa đơn "invoice_id"
            amount_original: "tổng tiền thu", // tổng tiền thu của khách với mã "code"
            createdBy_id: "nhân viên",
            method: "phương thức", // cash or card
            status: "trạng thái",
        },
        require: ["code", "amount", "createdBy_id", "method"],
        checkExists: [],
    },

    // user, customer, supplier, salesman, administator
    FIELD_USER: {
        getName: {
            username: "tên đăng nhập",
            password: "mật khẩu",
            type: "loại người dùng",
            name: "tên",
            phone: "số điện thoại",
            email: "mail",
            gender: "giới tính", // nam / nữ / ...
            createdBy_id: "",
        },
        require: [
            "username",
            "password",
            "type",
            "name",
            "phone",
            "createdBy_id",
        ],
        checkExists: [],
    },

    FIELD_CUSTOMER: {
        getName: {
            user_id: "mã người dùng",
            code: "mã khách hàng", // update trên server
            location: "khu vực", // tỉnh - huyện
            ward: "phường xã",
            date_of_birth: "ngày sinh",
            note: "ghi chú",
        },
        require: ["user_id"],
        checkExists: ["user_id"],
    },

    FIELD_SUPPLIER: {
        getName: {
            user_id: "mã người dùng",
            code: "mã nhà cung cấp", // update trên server
            location: "khu vực", // tỉnh - huyện
            ward: "phường xã",
            note: "ghi chú",
        },
        require: ["user_id"],
        checkExists: ["user_id"],
    },

    FIELD_SALESMAN: {
        getName: {
            user_id: "mã người dùng",
            code: "mã nhân viên", // update trên server
            id_number: "số CMND",
            id_issue_date: "ngày cấp",
            id_issue_by: "nơi cấp",
            status: 0,
        },
        require: ["user_id"],
        checkExists: ["user_id"],
    },

    FIELD_INTRO: {
        getName: {
            title: "Tiêu đề",
            content: "Nội dung",
            dbVer: "Phiên bản",
        },
        require: ["content"],
        checkExists: [],
    },

    FIELD_QA: {
        getName: {
            question: "Câu hỏi",
            answer: "Trả lời",
            index: "Index",
        },
        require: ["question", "answer"],
        checkExists: [],
    },

    FIELD_NGHIDINH: {
        getName: {
            name: "Tên đầy đủ",
            shortName: "Tên rút gọn",
        },
        require: ["name", "shortName"],
        checkExists: [],
    },

    FIELD_DIEUKHOAN: {
        getName: {
            sectionName: "Tên chương",
            sectionIndex: "Mã chương",
            title: "Tiêu đề ĐK",
            content: "Nội dung ĐK",
            weight: "Vị trí",
            nghiDinhID: "Nghị định",
        },
        require: ["title", "content", "nghiDinhID"],
        checkExists: [],
    },

    FIELD_NOTE: {
        getName: {
            title: "Tiêu đề lưu ý",
            content: "Nội dung lưu ý",
            type: "Type lưu ý", // 0: header, 1: dau muc (body), 2: footer (hien tai khong dung)
            weight: "Vị trí",
            status: "Trạng thái", // 0/undefined: hide, 1: show
        },
        require: ["title"],
        checkExists: [],
    },

    FIELD_ADS: {
        getName: {
            type: "Loại quảng cáo",// 0: google, 1: ảnh local
            link: "Link quảng cáo",
        },
        require: ["type"],
        checkExists: [],
    },

    FIELD_SETTING: {
        getName: {
            title: "Tiêu đề app",// 0: google, 1: ảnh local
            link: "Link banner",
            link_youtube: "Link youtube",
        },
        require: [],
        checkExists: [],
    },
};
