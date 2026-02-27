# 🚢 Safe Voyage (An Toàn Trên Tàu)

**Safe Voyage** là một tựa game Web dựa trên cơ chế phản xạ nhanh và quản lý theo lượt, được lấy cảm hứng từ những khoảnh khắc "dở khóc dở cười" của các nhân viên an toàn hàng hải. 

Bạn sẽ vào vai nhân viên an toàn duy nhất trên một chiếc tàu du lịch đông đúc. Nhiệm vụ của bạn là chạy khắp boong tàu để ngăn chặn các "thượng đế" vô kỷ luật thực hiện các hành động tự gây nguy hiểm cho bản thân (như nhảy múa trên lan can, tháo áo phao để lướt Tiktok, hay uống say mèm ngay sát mạn tàu).

![Game Snapshot](https://github.com/nongtiensonpro/safe_voyage/blob/master/public/favicon.ico?raw=true) *(Dự án được xây dựng 100% bằng "Vibe Coding" kết hợp giữa User & AI)*

---

## ✨ Tính năng Nổi Bật

- **Gameplay Nhịp Độ Cao:** Ngăn chặn các vụ tai nạn trước khi các thanh thời gian Cảnh báo (Vàng) chuyển sang Nguy hiểm (Cam) và Tai nạn (Đỏ).
- **Hệ Thống Tranh Luận (Excuse System):** Hành khách không mọc thêm não! Khi bị nhắc nhở, họ sẽ cự cãi. Bạn phải chọn câu trả lời đúng để thuyết phục hoặc bị tốn thêm thời gian.
- **6 Loại "Thượng Đế":** Khách Say Xỉn, Khách Gia Đình, Tiktoker, Sành Điệu, Tò Mò và cả Khách VIP... mỗi loại có một hành vi phá hoại độc quyền.
- **Động Cơ Thời Tiết:** Trải nghiệm 5 màn chơi. Từ Level 4 (Biển Động), mặt biển đổi sang tông màu xịt xám bão tố, sàn tàu rung lắc tròng trành khiến các hành khách bị trôi dạt dọc boong tàu, tăng cao độ khó.
- **Audio System "Tự Cấp":** Hệ thống âm thanh Synthesizer sử dụng 100% *Web Audio API* — tự tạo nhạc nền sóng biển và hiệu ứng SFX mà KHÔNG CẦN TẢI file `.mp3` hay `.wav` nào. Nhẹ mượt tuyệt đối.

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

Dự án là một minh chứng cho khả năng kết hợp công nghệ Web hiện đại để xử lý logic Game 2D mượt mà:
- **Core Framework:** [Next.js 15 (App Router)](https://nextjs.org/) & [React 18](https://react.dev/).
- **Engine Đồ Họa:** `HTML5 <canvas>` và `requestAnimationFrame` thuần túy để đạt hiệu năng 60 FPS mà không cần dùng đến các thư viện Engine nặng nề.
- **Giao Diện Phụ Trợ:** [Tailwind CSS](https://tailwindcss.com/) & [HeroUI](https://heroui.com/) cho các overlay và modal siêu tốc.
- **Âm thanh:** Vanilla JS `AudioContext` & Oscillators.

---

## 🚀 Hướng Dẫn Cài Đặt và Chạy Game Tại Máy (Local)

**Yêu cầu môi trường:** Đã cài đặt [Bun](https://bun.sh/) hoặc `npm`/`yarn`.

1. **Clone dự án:**
   ```bash
   git clone https://github.com/nongtiensonpro/safe_voyage.git
   cd safe_voyage/safe_voyage
   ```

2. **Cài đặt thư viện:**
   ```bash
   bun install
   # hoặc npm install
   ```

3. **Khởi động Local Server:**
   ```bash
   bun run dev
   # hoặc npm run dev
   ```

4. **Trải nghiệm:** Mở trình duyệt và truy cập `http://localhost:3000`

---

## 🌐 Triển khai Bản Chơi Ngày (GitHub Pages)

Game đã được biên dịch thành dạng Website Tĩnh (Static Export) và được cấu hình CI/CD thông qua **GitHub Actions**. Bất cứ cập nhật nào trên nhánh `master` sẽ tự động Deploy và có thể chơi ngay trên trình duyệt mà không cần cài đặt.

👉 **[Chơi Safe Voyage tại đây (GitHub Pages)](#)** *(Cập nhật link khi hoàn tất pages)*

---

### Ghi chú phát triển
Dự án được xây dựng toàn vẹn dựa trên file tài liệu Thiết kế (Game Design Document - `GDD_TauAnToan.md`) nằm trong thư mục gốc. Bạn có thể đọc file thiết kế để hiểu rõ hơn về các thông số chỉ số và hành vi của từng lớp đối tượng trong cấu trúc GameLoop.
