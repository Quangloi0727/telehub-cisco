# Môi trường
Node: v12.16.3

# Hướng dẫn chạy dự án trên DB local không có auth (nếu db ko auth thì để user và pass là #)
tạo file .env.local và thêm các thông tin sau:
PORT=4242
DATABASE=telehub_cisco_DB
DB_HOST=localhost
DB_PORT=27017
DB_USER=#
DB_PASS=#
IP_PUBLIC=localhost

# Format comment function
```javascript
 * *** Mô tả comment *********************************
 * *** Ngày: 2020-12-12
 * *** Dev: hainv
 * *** Lý do:
 * ...
 * *** Cách khắc phục duplicated:
 * ...
```

# Cách thêm 1 API mới
/server/auth_app.js
/server/routes/...
/server/controllers/...
/server/models/...

# Team Code Format
1. exports

Tập trung export trên đầu file, viết function ở dưới để dễ control