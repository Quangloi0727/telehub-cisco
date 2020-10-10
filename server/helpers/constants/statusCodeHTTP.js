module.exports = {

    SUCCESS_200: {
        code: 200,
        message: 'Success',
        message_detail: {
            default: 'Success',
            // Có thể viết thêm các mã lỗi riêng theo từng yêu cầu của model
        },
        description: 'Đáp ứng thực tế sẽ phụ thuộc vào phương thức yêu cầu được sử dụng.',
    },

    ERR_400: {
        code: 400,
        message: 'Bad Request',
        message_detail: {
            default: 'Bad Request',
            missingKey: 'Thiếu trường',
            isExists: 'đã tồn tại',
            inValid: 'không hợp lệ',
        },
        description: 'Máy chủ không thể hoặc sẽ không xử lý yêu cầu do lỗi máy khách rõ ràng (ví dụ: cú pháp yêu cầu không đúng định dạng, kích thước quá lớn, khung tin nhắn yêu cầu không hợp lệ hoặc định tuyến yêu cầu lừa đảo)',
    },

    ERR_401: {
        code: 401,
        message: 'Unauthorized',
        message_detail: {
            default: 'Unauthorized',
            incorrectUserName: 'Tên đăng nhập không chính xác',
            incorrectPass: 'Mật khẩu không chính xác',
        },
        description: 'Xác thực thất bại',
    },

    ERR_403: {
        code: 403,
        message: 'Forbidden',
        message_detail: {
            default: 'Forbidden',
        },
        description: 'Yêu cầu chứa dữ liệu hợp lệ và được máy chủ hiểu, nhưng máy chủ đang từ chối hành động. Điều này có thể là do người dùng không có các quyền cần thiết cho tài nguyên hoặc cần một tài khoản nào đó hoặc cố gắng thực hiện một hành động bị cấm (ví dụ: tạo một bản ghi trùng lặp khi chỉ cho phép một bản ghi). Mã này cũng thường được sử dụng nếu yêu cầu cung cấp xác thực thông qua trường tiêu đề WWW-xác thực, nhưng máy chủ không chấp nhận xác thực đó. Yêu cầu không nên lặp lại',
    },

    ERR_404: {
        code: 404,
        message: 'Not Found',
        message_detail: {
            Category: 'Không tìm thấy danh mục',
            Product: 'Không tìm thấy sản phẩm',
            User: 'Tài khoản không tồn tại',
        },
        description: 'Không thể tìm thấy tài nguyên được yêu cầu nhưng có thể có sẵn trong tương lai. Các yêu cầu tiếp theo của khách hàng được cho phép',
    },

    ERR_500: {
        code: 500,
        message: 'Internal Server Error',
        message_detail: {
            default: 'Internal Server Error',
        },
        description: 'Một thông báo lỗi chung, được đưa ra khi gặp phải một điều kiện bất ngờ và không có thông báo cụ thể nào phù hợp hơn',
    },
}

// Tham khảo: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes

// https://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api
// 200 OK - Response to a successful GET, PUT, PATCH or DELETE.Can also be used for a POST that doesn't result in a creation.
// 201 Created - Response to a POST that results in a creation.Should be combined with a Location header pointing to the location of the new resource
// 204 No Content - Response to a successful request that won't be returning a body (like a DELETE request)
// 304 Not Modified - Used when HTTP caching headers are in play
// 400 Bad Request - The request is malformed, such as if the body does not parse
// 401 Unauthorized - When no or invalid authentication details are provided.Also useful to trigger an auth popup if the API is used from a browser
// 403 Forbidden - When authentication succeeded but authenticated user doesn't have access to the resource
// 404 Not Found - When a non - existent resource is requested
// 405 Method Not Allowed - When an HTTP method is being requested that isn't allowed for the authenticated user
// 410 Gone - Indicates that the resource at this end point is no longer available.Useful as a blanket response for old API versions
// 415 Unsupported Media Type - If incorrect content type was provided as part of the request
// 422 Unprocessable Entity - Used for validation errors
// 429 Too Many Requests - When a request is rejected due to rate limiting