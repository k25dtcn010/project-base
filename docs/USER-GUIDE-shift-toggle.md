# Hướng dẫn sử dụng Chế độ hiển thị ca làm việc

## 📖 Giới thiệu

Hệ thống chấm công hiện có **2 chế độ hiển thị** để bạn dễ dàng theo dõi ca làm việc:

1. **Chế độ Gọn gàng** (mặc định) - Chỉ hiển thị ca chính
2. **Chế độ Chi tiết** - Hiển thị tất cả các ca, kể cả ca biên

## 🎯 Nút chuyển đổi

Tìm nút này ở góc trên bên phải của bảng chấm công:

### Chế độ Gọn gàng (Mặc định)
```
┌────────────────────────┐
│ ⏰ Chỉ ca chính [Đã lọc] │
└────────────────────────┘
```
**Hiển thị:** Chỉ các ca làm việc chính thức được phân công

### Chế độ Chi tiết
```
┌──────────────────────┐
│ ✓ Chi tiết đầy đủ    │
└──────────────────────┘
```
**Hiển thị:** Tất cả các ca, bao gồm ca phát sinh tự động

---

## 🔍 Phân biệt các loại ca

### ✅ Ca chính (Primary Shift)
**Đặc điểm:**
- Viền đậm, liền nét
- Là ca được công ty phân công chính thức
- Chiếm phần lớn thời gian làm việc

**Ví dụ:**
```
✓ Ca Hành chính
  08:00 - 17:00 • 9h
```

### 🔹 Ca biên (Boundary Shift)
**Đặc điểm:**
- Có icon 🔹 ở đầu
- Viền đứt nét (dash)
- Màu nhạt hơn (60% opacity)
- Chỉ chiếm < 25% thời lượng ca

**Ví dụ:**
```
🔹 Ca Sáng
   07:48 - 08:00 • 0.2h (10% overlap)
```

**Giải thích:** Bạn đến sớm hơn ca chính 12 phút, hệ thống tự động ghi nhận.

---

## 💡 Khi nào dùng chế độ nào?

### Dùng Chế độ Gọn gàng khi:
✅ Xem nhanh ca làm việc hàng ngày  
✅ Kiểm tra số giờ làm việc chính  
✅ In báo cáo cho quản lý  
✅ Không muốn thấy thông tin rườm rà

### Dùng Chế độ Chi tiết khi:
✅ Muốn xem chính xác giờ vào/ra  
✅ Kiểm tra các ca ngắn (đến sớm, về muộn)  
✅ Debug khi có sai lệch  
✅ Xác nhận tất cả giờ làm đã được ghi nhận

---

## 📋 Ví dụ thực tế

### Tình huống 1: Đến sớm 15 phút

**Chấm công:**
- Vào: 07:45
- Ra: 17:00
- Ca được phân: Hành chính (08:00-17:00)

**Chế độ Gọn gàng:**
```
✓ Ca Hành chính
  08:00 - 17:00 • 9h
```

**Chế độ Chi tiết:**
```
🔹 Ca Sáng
   07:45 - 08:00 • 0.25h

✓ Ca Hành chính
  08:00 - 17:00 • 9h
```

**Giải thích:** 15 phút đến sớm vẫn được ghi nhận trong "Ca Sáng" nhưng ẩn đi để gọn gàng.

---

### Tình huống 2: Làm OT đến 19:00

**Chấm công:**
- Vào: 08:00
- Ra: 19:00
- Ca được phân: Hành chính (08:00-17:00)

**Chế độ Gọn gàng:**
```
✓ Ca Hành chính
  08:00 - 17:00 • 9h

✓ Ca Tối
  17:00 - 19:00 • 2h
```

**Chế độ Chi tiết:**
```
✓ Ca Hành chính
  08:00 - 17:00 • 9h (100% overlap)

✓ Ca Tối
  17:00 - 19:00 • 2h (28% overlap)
```

**Lưu ý:** Ca OT 2 giờ vẫn hiển thị ở cả 2 chế độ vì chiếm 28% thời lượng Ca Tối.

---

### Tình huống 3: Làm xuyên nhiều ca (7h - 19h)

**Chấm công:**
- Vào: 07:00
- Ra: 19:00
- Ca được phân: Hành chính (08:00-17:00)

**Chế độ Gọn gàng:**
```
✓ Ca Hành chính
  08:00 - 17:00 • 9h

✓ Ca Tối
  17:00 - 19:00 • 2h
```

**Chế độ Chi tiết:**
```
🔹 Ca Sáng
   07:00 - 08:00 • 1h (50% overlap)

✓ Ca Hành chính
  08:00 - 17:00 • 9h (100% overlap)

✓ Ca Tối
  17:00 - 19:00 • 2h (28% overlap)
```

**Giải thích:** 
- 1 giờ đến sớm được ẩn vì chỉ chiếm 50% Ca Sáng (< ngưỡng)
- Ca OT 2 giờ vẫn hiển thị vì > 25%

---

## ❓ Câu hỏi thường gặp

### 1. Tại sao có ca biên?
**Trả lời:** Khi bạn làm việc xuyên qua nhiều khung giờ (ví dụ: đến lúc 7h50 trong khi ca bắt đầu 8h), hệ thống tự động phát hiện và ghi nhận toàn bộ thời gian. Ca biên giúp không bỏ sót bất kỳ phút làm việc nào.

### 2. Ca biên có được tính lương không?
**Trả lời:** Có! Tất cả thời gian làm việc đều được lưu trong hệ thống. Việc ẩn/hiện chỉ ảnh hưởng giao diện, không ảnh hưởng tính toán lương.

### 3. Làm sao biết ca nào là ca chính?
**Trả lời:** Ca chính là ca được công ty phân công chính thức cho bạn (ví dụ: Hành chính 8h-17h). Các ca khác như đến sớm, về muộn là ca biên.

### 4. Nút chuyển đổi ở đâu?
**Trả lời:** Ở góc trên bên phải của bảng chấm công, cạnh nút chọn "Theo tuần/Theo tháng".

### 5. Có cần bật chi tiết để check công không?
**Trả lời:** Không bắt buộc. Chế độ gọn gàng đã đủ cho việc kiểm tra hàng ngày. Chỉ bật chi tiết khi cần xem kỹ hoặc debug.

### 6. Thế nào là "< 25% overlap"?
**Trả lời:** 
- Ca Sáng kéo dài 2 giờ (6h-8h)
- Bạn chỉ làm 12 phút (7h48-8h)
- 12 phút = 10% của 2 giờ → Là ca biên
- Nếu làm > 30 phút (> 25%) → Là ca chính

### 7. Ca biên có cần phê duyệt không?
**Trả lời:** Tùy quy định công ty. Thông thường ca biên < 30 phút sẽ tự động được duyệt, còn lại cần quản lý xác nhận.

---

## 🎓 Tips sử dụng hiệu quả

### Tip 1: Dùng mặc định cho công việc hàng ngày
Để chế độ "Chỉ ca chính" để xem nhanh, tránh bị rối mắt.

### Tip 2: Bật chi tiết khi check lương cuối tháng
Bật "Chi tiết đầy đủ" để xem tất cả giờ làm việc có được ghi nhận đúng không.

### Tip 3: Screenshot chế độ gọn khi báo cáo
Khi gửi báo cáo cho sếp, dùng chế độ gọn gàng trông professional hơn.

### Tip 4: Bật chi tiết khi có tranh chấp
Nếu có vấn đề về số giờ làm việc, bật chi tiết để có bằng chứng cụ thể.

---

## 📞 Hỗ trợ

Nếu có thắc mắc hoặc phát hiện sai sót, vui lòng liên hệ:

- **Phòng IT:** it@company.com
- **Phòng HR:** hr@company.com  
- **Hotline:** 1900-xxxx

---

**Phiên bản:** 1.0  
**Cập nhật lần cuối:** Tháng 1, 2025  
**Áp dụng cho:** Tất cả nhân viên sử dụng hệ thống chấm công