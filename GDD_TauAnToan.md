# 🚢 GAME DESIGN DOCUMENT
## "AN TOÀN TRÊN TÀU" *(Safe Voyage)*
**Version:** 1.0 | **Ngày:** 27/02/2026 | **Thể loại:** Casual Management / Action

---

## 1. TỔNG QUAN (Overview)

### 1.1 Concept Statement
> *Bạn là nhân viên an toàn duy nhất trên một chuyến tàu khách đông đúc. Nhiệm vụ của bạn rất đơn giản: giữ cho tất cả hành khách an toàn. Nhưng hành khách thì... không bao giờ hợp tác.*

### 1.2 Mô Tả Ngắn
Game quản lý/phản xạ nhanh theo lượt. Người chơi điều khiển nhân viên an toàn đi lại trên boong tàu, liên tục ngăn chặn hành khách làm những điều nguy hiểm — từ cởi áo phao để chụp ảnh đến thò tay xuống biển "cho mát".

### 1.3 Tham Khảo (References)
| Game | Yếu tố tham khảo |
|---|---|
| Brother Hai's Pho Restaurant | Đồ họa pixel/cartoon, gameplay quản lý vui nhộn |
| Overcooked | Cơ chế di chuyển nhanh, nhiều việc cùng lúc |
| Untitled Goose Game | Tính hài hước, NPC "phá hoại" |

---

## 2. GAMEPLAY MECHANICS

### 2.1 Vòng Lặp Cơ Bản (Core Loop)

```
[Hành khách xuất hiện]
        ↓
[Hành khách bắt đầu hành vi nguy hiểm]
        ↓
[Thanh nguy hiểm tăng dần] ← Người chơi phải phát hiện!
        ↓
    [Đến kịp?]
   /          \
[Có]          [Không]
  ↓               ↓
[Can thiệp]   [Tai nạn xảy ra]
  ↓               ↓
[+Điểm]       [-Điểm / Game Over nếu đủ tai nạn]
```

### 2.2 Điều Khiển (Controls)
- **Click / Tap:** Di chuyển nhân viên đến vị trí
- **Click vào hành khách:** Tương tác / can thiệp
- **Double-click:** Chạy nhanh (hồi chiêu 5 giây)
- **Phím tắt (PC):** WASD để di chuyển, Space để tương tác

### 2.3 Hệ Thống Can Thiệp (Intervention System)

Mỗi hành vi nguy hiểm có **3 giai đoạn:**

| Giai đoạn | Màu cảnh báo | Thời gian còn lại | Hành động cần làm |
|---|---|---|---|
| ⚠️ Chuẩn bị | Vàng | ~5 giây | Chạy tới |
| 🔶 Đang làm | Cam | ~3 giây | Tương tác |
| 🔴 Nguy hiểm cao | Đỏ nhấp nháy | ~1 giây | Can thiệp khẩn cấp |

### 2.4 Hệ Thống "Lý Do" (Excuse System)
Điểm độc đáo của game: Hành khách **cự cãi** khi bị can thiệp. Người chơi phải chọn **phản hồi đúng** để thuyết phục.

**Ví dụ tình huống:**

*Khách đang cởi áo phao để chụp ảnh:*
- Lý do: "Áo phao xấu lắm, chụp ảnh trông béo quá!"
- Lựa chọn A: "Mặc áo phao vẫn đẹp mà!" → ❌ Không thuyết phục
- Lựa chọn B: "Có luật bắt buộc trên tàu đó chị ơi!" → ✅ Thành công
- Lựa chọn C: "Tôi có thể giúp chị chụp góc đẹp hơn!" → ✅ Thành công (bonus điểm)

---

## 3. DANH SÁCH HÀNH VI NGUY HIỂM

### 3.1 Loại A — Liên Quan Áo Phao

| ID | Hành vi | Lý do khách đưa ra | Mức độ nguy hiểm |
|---|---|---|---|
| A1 | Cởi áo phao chụp ảnh | "Mặc xấu, chụp ảnh không đẹp" | ⭐⭐ |
| A2 | Giấu áo phao vào túi | "Nóng quá, mặc khó chịu" | ⭐⭐ |
| A3 | Cho con cởi áo phao | "Bé không quen mặc, khóc suốt" | ⭐⭐⭐ |
| A4 | Mặc áo phao sai cách | "Tôi mặc rồi đó!" (thực ra mặc ngược) | ⭐ |

### 3.2 Loại B — Vị Trí Nguy Hiểm

| ID | Hành vi | Lý do khách đưa ra | Mức độ nguy hiểm |
|---|---|---|---|
| B1 | Leo lên lan can chụp ảnh | "Góc view đẹp hơn ở trên!" | ⭐⭐⭐⭐ |
| B2 | Đứng ở mũi tàu kiểu Titanic | "Lãng mạn lắm!" | ⭐⭐⭐ |
| B3 | Thò tay xuống nước | "Nước mát lắm, sờ tí thôi!" | ⭐⭐⭐ |
| B4 | Ngồi trên thành tàu | "Ngồi đây mát hơn bên trong" | ⭐⭐⭐ |
| B5 | Đứng quá gần chân vịt | "Xem máy tàu hoạt động thú vị quá!" | ⭐⭐⭐⭐ |

### 3.3 Loại C — Hành Vi Đặc Biệt

| ID | Hành vi | Lý do khách đưa ra | Mức độ nguy hiểm |
|---|---|---|---|
| C1 | Trẻ em chạy nhảy trên boong ướt | "Bé hiếu động, không sao đâu" | ⭐⭐ |
| C2 | Uống rượu rồi đứng gần mạn tàu | "Tôi đang vui mà!" | ⭐⭐⭐⭐ |
| C3 | Thả đồ vật xuống biển | "Thả cho cá ăn, có hại gì!" | ⭐ |
| C4 | Chụp ảnh selfie chìa người ra ngoài | "Tôi cầm lan can rồi mà!" | ⭐⭐⭐ |
| C5 | Nhóm khách cùng kéo nhau ra lan can | "Nhiều người thì ổn thôi!" | ⭐⭐⭐⭐⭐ |

---

## 4. NHÂN VẬT (Characters)

### 4.1 Nhân Vật Chính — Nhân Viên An Toàn

**Tên gợi ý:** Anh Minh / Chị Lan (người chơi chọn)

| Thuộc tính | Giá trị mặc định | Có thể nâng cấp? |
|---|---|---|
| Tốc độ di chuyển | 3/5 | ✅ |
| Sức thuyết phục | 2/5 | ✅ |
| Tầm nhìn (phát hiện sớm) | 2/5 | ✅ |
| Năng lượng (sprint) | 3/5 | ✅ |

**Trang bị:**
- Áo đồng phục nhân viên tàu
- Còi (dùng để gọi sự chú ý từ xa)
- Bộ đàm (mở khóa ở level 5)
- Áo phao dự phòng (mở khóa ở level 8)

### 4.2 Các Loại Hành Khách (NPC Types)

**Khách Chụp Ảnh (Photo Junkie)**
- Ngoại hình: Cầm điện thoại to, đội mũ du lịch
- Hành vi chủ yếu: A1, B1, B2, C4
- Tính cách: Không nghe lý do, chỉ nghe nếu đề nghị giúp chụp đẹp hơn

**Khách Gia Đình (Family Group)**
- Ngoại hình: Bố mẹ + 1-2 đứa trẻ
- Hành vi chủ yếu: A3, C1, B3
- Tính cách: Bận chăm con nên không chú ý nguy hiểm

**Khách "Sành Điệu" (Trendy)**
- Ngoại hình: Quần áo thời trang, lo ngại về ngoại hình
- Hành vi chủ yếu: A1, A2, B4
- Tính cách: Áo phao "xấu không thể chấp nhận được"

**Khách Tò Mò (Curious Explorer)**
- Ngoại hình: Kính lớn, áo nhiều túi
- Hành vi chủ yếu: B5, B3, C3
- Tính cách: Thực sự tò mò, thuyết phục bằng kiến thức thì hiệu quả

**Khách Say Xỉn (Party Guest)**
- Ngoại hình: Cầm cốc, đi không vững
- Hành vi chủ yếu: C2, B1, B4
- Tính cách: Khó thuyết phục nhất, cần 2 lần can thiệp

**Khách VIP (Important Guest)**
- Ngoại hình: Vest đắt tiền, thái độ kiêu ngạo
- Hành vi đặc biệt: Tất cả loại, nhưng **phản đối dữ dội hơn**
- Tính cách: "Anh biết anh là ai không?" — Mất nhiều thời gian hơn để xử lý

---

## 5. THIẾT KẾ MÀN CHƠI (Level Design)

### 5.1 Bản Đồ Tàu (Ship Layout)

```
╔══════════════════════════════════════════════════════╗
║  🏔️  MŨI TÀU (Nguy hiểm cao)                        ║
║  ┌──────────────────────────────────────────────┐   ║
║  │         BOONG TRÊN (Upper Deck)              │   ║
║  │  [Ghế ngồi] [Ghế ngồi]  ⚠️[Lan can]⚠️        │   ║
║  │                                              │   ║
║  │  [Bar nhỏ]   [Sàn nhảy]  ⚠️[Mạn tàu]⚠️       │   ║
║  └──────────────────────────────────────────────┘   ║
║  ┌──────────────────────────────────────────────┐   ║
║  │         BOONG GIỮA (Main Deck)               │   ║
║  │  [Ghế ngồi] [Nhà VS]  [Cầu thang]           │   ║
║  │                                              │   ║
║  │  ⚠️[Khu vực máy tàu]  ⚠️[Mạn tàu trái]⚠️     │   ║
║  └──────────────────────────────────────────────┘   ║
║  🔧 ĐUÔI TÀU (Nguy hiểm - Chân vịt)                 ║
╚══════════════════════════════════════════════════════╝
```

**Màu sắc khu vực:**
- 🟢 Xanh lá: An toàn (ghế ngồi, cabin)
- 🟡 Vàng: Cần chú ý (lối đi, cầu thang)
- 🔴 Đỏ: Nguy hiểm (lan can, mạn tàu, mũi/đuôi tàu)

### 5.2 Cấu Trúc Màn Chơi (Level Progression)

| Level | Tên | Số khách | Khu vực mở | Thời tiết | Tốc độ hành vi |
|---|---|---|---|---|---|
| 1 | "Ngày đầu làm việc" | 4-6 | Boong giữa | Nắng đẹp | Chậm |
| 2 | "Cuối tuần đông khách" | 8-10 | Boong giữa + trên | Nắng | Bình thường |
| 3 | "Nhóm du lịch" | 12-15 | Toàn tàu | Nắng nhẹ | Bình thường |
| 4 | "Trời giông bão nhẹ" | 10-12 | Toàn tàu | Mây | Nhanh |
| 5 | "Khách VIP khó tính" | 8-10 | Toàn tàu | Gió | Nhanh |
| 6 | "Đêm trên biển" | 10-12 | Toàn tàu | Đêm | Rất nhanh |
| 7 | "Bão đang đến" | 15+ | Toàn tàu | Sóng to | Cực nhanh |
| 8 | "Đêm Giao Thừa" | 20+ | Toàn tàu | Pháo hoa | Hỗn loạn |

### 5.3 Điều Kiện Thắng/Thua

**Thắng màn:**
- Hoàn thành chuyến đi với độ an toàn ≥ 70%
- Không có tai nạn nghiêm trọng nào

**Sao đánh giá:**
- ⭐ 1 sao: Hoàn thành nhưng có 2-3 tai nạn nhỏ
- ⭐⭐ 2 sao: Hoàn thành với ≤ 1 tai nạn nhỏ
- ⭐⭐⭐ 3 sao: Hoàn hảo — không tai nạn, điểm thuyết phục cao

**Thua:**
- 3 tai nạn nghiêm trọng trong 1 màn
- Bất kỳ hành khách nào rơi xuống biển

---

## 6. HỆ THỐNG ĐIỂM VÀ PHẦN THƯỞNG

### 6.1 Cách Tính Điểm

| Hành động | Điểm |
|---|---|
| Ngăn chặn hành vi nguy hiểm (giai đoạn vàng) | +100 |
| Ngăn chặn (giai đoạn cam) | +60 |
| Ngăn chặn (giai đoạn đỏ) | +30 |
| Thuyết phục bằng câu trả lời tốt nhất | +50 bonus |
| Cứu hành khách khỏi tai nạn | +200 |
| Tai nạn nhỏ xảy ra | -100 |
| Tai nạn nghiêm trọng | -300 |

### 6.2 Hệ Thống Nâng Cấp (Skill Tree)

**Nhánh Tốc Độ:**
- Đi nhanh hơn 20%
- Giảm cooldown sprint
- Tự động chạy đến điểm nguy hiểm gần nhất

**Nhánh Thuyết Phục:**
- Thêm lựa chọn câu trả lời
- Hiển thị gợi ý câu trả lời tốt
- Khách nghe lời ngay mà không cần giải thích

**Nhánh Quan Sát:**
- Phát hiện hành vi sớm hơn 2 giây
- Radar mini-map hiển thị điểm nguy hiểm
- Hành khách sắp làm gì hiển thị bong bóng suy nghĩ

**Nhánh Dụng Cụ:**
- Thêm áo phao dự phòng
- Còi tầm xa
- Bộ đàm gọi đồng nghiệp hỗ trợ

---

## 7. THIẾT KẾ ÂM THANH & ĐỒ HỌA

### 7.1 Phong Cách Đồ Họa

**Tham khảo:** Cartoon 2D đơn giản, màu sắc tươi sáng kiểu Brother Hai's Pho Restaurant

- Tỉ lệ nhân vật: Đầu to, người nhỏ (chibi-ish)
- Palette màu: Xanh biển, trắng, cam (màu áo phao)
- Font chữ: Tròn, vui nhộn
- Hiệu ứng: Dấu chấm than ❗ khi nguy hiểm, tim 💗 khi thành công

**Khu vực màu sắc rõ ràng để người chơi nhận biết ngay:**
- Vùng an toàn: Sàn gỗ nhạt, ánh sáng ấm
- Vùng nguy hiểm: Sàn đỏ/cam nhấp nháy, ánh sáng cảnh báo

### 7.2 Âm Thanh

| Sự kiện | Âm thanh |
|---|---|
| Hành khách bắt đầu hành vi nguy hiểm | Tiếng "ting!" nhẹ |
| Mức nguy hiểm tăng cao | Tiếng cảnh báo liên hồi |
| Can thiệp thành công | Tiếng "woohoo!" vui vẻ |
| Tai nạn xảy ra | Tiếng "splash" / "oops!" |
| Thuyết phục thành công | Nhạc fanfare nhỏ |
| Khách VIP phản đối | Giọng kiêu ngạo đặc trưng |

**Nhạc nền:** Nhạc biển vui tươi, nhịp nhanh dần theo độ khó

---

## 8. PHÁT TRIỂN KỸ THUẬT

### 8.1 Tech Stack Đề Xuất

| Platform | Engine/Framework | Lý do |
|---|---|---|
| Web | **Phaser.js 3** | Mạnh cho 2D web game, cộng đồng lớn |
| Web đơn giản hơn | **HTML5 Canvas + JS thuần** | Ít dependency |
| Mobile | **Unity 2D** | Nếu muốn xuất app sau này |

### 8.2 Cấu Trúc Code Cơ Bản

```
src/
├── scenes/
│   ├── MenuScene.js
│   ├── GameScene.js
│   └── UIScene.js
├── objects/
│   ├── Player.js          ← Nhân viên an toàn
│   ├── Passenger.js       ← Base class hành khách
│   ├── PassengerTypes/
│   │   ├── PhotoJunkie.js
│   │   ├── FamilyGroup.js
│   │   └── ...
│   └── HazardZone.js      ← Vùng nguy hiểm
├── systems/
│   ├── HazardSystem.js    ← Quản lý hành vi nguy hiểm
│   ├── DialogSystem.js    ← Hệ thống hội thoại thuyết phục
│   └── ScoreSystem.js
└── data/
    ├── levels.json        ← Cấu hình từng màn
    └── behaviors.json     ← Hành vi + lý do + câu trả lời
```

### 8.3 Ưu Tiên Phát Triển (MVP vs Full)

**MVP (Chạy được, fun được):**
1. 1 boong tàu đơn giản
2. 3 loại hành vi nguy hiểm cơ bản
3. 2 loại hành khách
4. Hệ thống điểm cơ bản
5. 3 màn chơi

**Full Version thêm:**
- Tất cả loại hành khách và hành vi
- Hệ thống hội thoại thuyết phục
- Nâng cấp nhân vật
- 8+ màn + thời tiết
- Âm thanh và nhạc nền

---

## 9. VIBE & TONE

Game phải luôn giữ **tông vui tươi, hài hước** — không được nặng nề hay đáng sợ dù nói về tai nạn.

- Khi tai nạn xảy ra: Hoạt ảnh hài (khách rơi xuống biển nhưng ngay lập tức bơi lên vẫy tay)
- Hành khách luôn có lý do **buồn cười, ngốc nghếch** chứ không phải ác ý
- Nhân viên nói chuyện **thân thiện, hài hước** không phải cứng nhắc
- Unlock thành tích vui: "Ngăn được 10 cú tự chụp nguy hiểm" 📸

---

## 10. ROADMAP (MỞ RỘNG)

_Dự án đã hoàn thành Phase 0 đến Phase 5 (Core MVP). Dưới đây là Roadmap cho giai đoạn mở rộng "Gameplay 2.0"._

| Giai đoạn | Thời gian ước tính | Deliverable |
|---|---|---|
| **Phase 6** | 1-2 tuần | **Advanced Graphics:** Nâng cấp đồ họa Canvas. Chuyển từ Emojis sang đồ họa có Animation/Path. Thêm chướng ngại vật (vật thể tĩnh) trên mặt boong khiến NPC và Player phải tìm đường tránh né. |
| **Phase 7** | 1-2 tuần | **Economy & Safe-mart:** Xây dựng hệ thống nâng cấp Kỹ năng (Skill Tree - GDD 6.2). Chuyển đổi Điểm (Score) thành Tiền tệ. Xây dựng giao diện "Cửa hàng" giữa các Level để mua Tốc độ, Còi, Mini-map. |
| **Phase 8** | 1-2 tuần | **Advanced Levels & Lighting:** Áp dụng hệ thống Ánh sáng động (Dynamic Lighting). Phát triển Level 6 (Đêm tối mù sương), Level 7 (Biển Động Đêm Bão), Level 8 (Đêm Giao Thừa Cực Khó). |
| **Phase 9** | 1 tuần | **Final Boss & Polish 2.0:** Hoàn thiện trải nghiệm, tối ưu FPS khi số lượng Particle và Lighting tăng cao. |

---

*Tài liệu này là phiên bản 1.1 — Liên tục cập nhật theo tiến trình Vibe Coding.*
