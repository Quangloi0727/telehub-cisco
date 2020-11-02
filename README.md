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