# Hệ motion của Nook

## Mục tiêu

Nook cần chuyển động chậm hơn bản cũ nhưng không được tạo cảm giác ứng dụng xử
lý chậm. Cách làm là phản hồi ngay ở khung hình đầu, sau đó để vật thể giảm tốc
và ổn định có trọng lượng. Launch là khoảnh khắc thương hiệu duy nhất được phép
có biên đạo dài; motion lặp lại trong công việc hằng ngày phải ngắn hơn.

## Ba loại thời gian không được đánh đồng

1. **Interaction latency:** từ lúc người dùng bấm đến lúc giao diện bắt đầu phản
   hồi. Mục tiêu của Nook là 0ms theo khả năng của khung hình kế tiếp.
2. **Animation duration:** thời gian vật thể đi từ trạng thái đầu đến trạng thái
   cuối. Đây là phần được làm chậm để tăng cảm giác vật chất.
3. **Choreography delay:** khoảng lệch có chủ ý giữa các phần tử cùng nhóm. Nook
   chỉ dùng khoảng lệch ngắn và có giới hạn; không biến stagger thành hàng đợi.

Lập luận này quan trọng vì ngưỡng Doherty thường bị diễn giải sai thành “hãy
thêm 400ms độ trễ”. Nghiên cứu gốc nói về lợi ích của phản hồi hệ thống dưới một
giây, đặc biệt quanh 0,3 giây trong bối cảnh được thử nghiệm; nó không khuyên trì
hoãn phản hồi để giao diện trông tự nhiên hơn.

- [The Economic Value of Rapid Response Time](https://archive.computerhistory.org/resources/access/text/2024/03/102751398-05-01-acc.pdf)

## Bằng chứng nghiên cứu

### Nội dung mới phải xuất hiện sớm

Nghiên cứu CHI 2010 của Nokia Research Center và VTT so sánh các transition
fade/zoom dài 1,4–2,2 giây. Biến số ảnh hưởng mạnh nhất đến cảm giác nhanh là
đưa ít nhất một phần của màn hình mới lên sớm; tổng thời lượng và zoom đứng sau.
Kết quả này không có nghĩa tab Nook nên dài hai giây. Nó cho biết một transition
có thể settle chậm hơn nếu đích đến đã hiện từ đầu.

- [Animated UI Transitions and Perception of Time](https://cris.vtt.fi/en/publications/animated-ui-transitions-and-perception-of-time-a-user-study-on-an/)

### Mượt có ích hơn đột ngột, nhưng dài hơn không luôn tốt hơn

Thí nghiệm CHI 1996 cho thấy người tham gia chính xác hơn với gradual transition
so với abrupt transition trong các tác vụ mà chuyển động giúp hiểu thay đổi.
Một nghiên cứu AVI 2008 về zooming interface so sánh 1ms, 250ms, 500ms và
1.000ms: các điều kiện có animation được ưa thích hơn và hỗ trợ tác vụ tốt hơn,
nhưng 250ms có thể hiệu quả ngang các bản dài hơn trong bối cảnh đó. Vì vậy,
Nook không lấy “càng dài càng sang” làm nguyên tắc; 480ms được dành cho thay đổi
toàn màn hình vì kích thước và khoảng di chuyển lớn hơn một control thông thường.

- [Does Animation in User Interfaces Improve Decision Making?](https://www.cmu.edu/dietrich/sds/ddmlab/papers/gonzalez1996.pdf)
- [The Effect of Animated Transitions in Zooming Interfaces](https://hci.cs.umanitoba.ca/assets/publication_files/2008-AVI-Shanmugasundaram-AnimatedTransitions.pdf)

### Stagger là công cụ phân cấp, không phải mặc định cho mọi thứ

Fluent 2 mô tả stagger như cách dẫn mắt và làm rõ thứ bậc, đồng thời yêu cầu giữ
offset ngắn và kiểm soát tổng thời gian. Nghiên cứu về theo dõi nhiều vật thể lại
cho thấy stagger có thể không giúp, thậm chí làm mất thông tin common-motion.
Do đó Nook chỉ stagger các nhóm nhỏ, theo thứ tự đọc, với độ lệch toàn nhóm dưới
180ms; danh sách dài không lần lượt “diễu hành” vào màn hình.

- [Fluent 2 Motion](https://fluent2.microsoft.design/motion)
- [The Not-So-Staggering Effect of Staggered Animation](https://www.cs.toronto.edu/~fchevali/fannydotnet//animations/staggered-animations/)

### Chuyển động tự nhiên đến từ easing và khả năng bị ngắt

Apple nhấn mạnh motion phải ngắn gọn, chính xác, phù hợp quan hệ không gian và
không bắt người dùng chờ animation kết thúc. Android Compose giải thích vì sao
spring thường được cảm nhận tự nhiên: nó giữ vận tốc và có thể bị ngắt. Nook hiện
dùng CSS, nên mô phỏng tính chất đó bằng đường cong giảm tốc mạnh
`cubic-bezier(0.16, 1, 0.3, 1)` và không khóa thao tác trong lúc chuyển động.

- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Android Compose Animation Quick Guide](https://developer.android.com/develop/ui/compose/animation/quick-guide)
- [Material Design 3: Motion](https://m3.material.io/styles/motion/overview/how-it-works)

## Những ứng dụng giao diện được đánh giá cao cho thấy điều gì

Apple Design Awards và Google Play Best không phải nghiên cứu định lượng về sở
thích hay bảng xếp hạng “đẹp nhất”. Chúng được dùng ở đây như mẫu quan sát đã qua
tuyển chọn. Các sản phẩm liên quan đến Nook cho thấy vài mẫu lặp lại:

- Moonlitt và Tide Guide được ghi nhận vì thông tin rõ, animation tùy biến gắn
  với nội dung và cảm giác tinh chỉnh, không phải vì mọi vật đều chuyển động.
- iA Writer ưu tiên trạng thái tập trung; Mela dùng dim/highlight đúng thời điểm
  thay vì biến toàn bộ màn hình thành spectacle.
- Focus Friend được Google chọn vì một công cụ tập trung đơn giản nhưng có nhân
  vật và phản hồi đủ đáng nhớ.
- CapWords và các sản phẩm “delight” gắn animation với một hành động cụ thể,
  không rải hiệu ứng ngang nhau lên mọi card.

- [Apple Design Awards 2026](https://developer.apple.com/design/awards/)
- [Apple Design Awards 2025](https://developer.apple.com/design/awards/2025/)
- [Google Play Best of 2025](https://blog.google/products-and-platforms/platforms/google-play/best-apps-games-2025/)

Kết luận áp dụng cho Nook: launch có cá tính; tab giữ quan hệ không gian; block
chỉ chuyển động theo vai trò; trạng thái hoàn thành phản hồi vừa đủ. Không sao
chép hiệu ứng hoặc timing của một app khác khi không có dữ liệu đo trực tiếp.

## Motion tokens đã chọn

| Lớp motion | Delay bắt đầu | Duration | Easing | Vai trò |
|---|---:|---:|---|---|
| Phản hồi control | 0ms | 180ms | arrive | Xác nhận bấm/nhấn |
| Thay đổi trạng thái | 0ms | 280ms | standard | Chọn, hoàn thành, đổi màu |
| Element trong nhóm | 28ms mỗi mục | 420ms | arrive | Nhóm nhỏ có thứ tự đọc |
| Nội dung tab | 0ms | 480ms | arrive | Giữ hướng tiến/lùi |
| Block chính | 30–175ms | 480–560ms | arrive | Dẫn mắt theo thứ bậc |
| Lens dock | 0ms | 460ms | arrive | Cho đích đến có trọng lượng |
| Ambient wash | 0ms | 620ms | standard | Đổi không khí, không tranh chú ý |
| Reduced motion | 0ms | 140ms | ease-out | Fade, bỏ dịch chuyển và stagger |

`arrive` là `cubic-bezier(0.16, 1, 0.3, 1)`; `standard` là
`cubic-bezier(0.4, 0, 0.2, 1)`. Không có delay trống trước phản hồi đầu tiên.

## Biên đạo từng tab

### Home

Header xuất hiện trước; Day Arc ổn định tiếp theo; “Việc nên làm tiếp” mở như
một bề mặt có hướng; Weekly Compass đến sau cùng. Bốn bước Day Arc lệch nhau
28ms để diễn đạt trình tự nhưng không biến thành bốn cảnh riêng.

### Today

Quỹ thời gian mở trước vì nó tạo khung quyết định. Biểu mẫu thêm việc theo sau,
rồi ba lane ổn định từ Anchor đến Optional. Một task mới chỉ animate chính hàng
vừa thêm; không chạy lại cả danh sách.

### Habits

Trường lavender settle như một vùng thống nhất. Các habit tile có nhịp ngắn theo
thứ tự đọc; bảng 7 ngày và biểu mẫu thêm thói quen nhẹ hơn, xuất hiện sau.

### Focus

Timer có transition nặng và ít dịch chuyển nhất để tạo cảm giác vững. Distraction
pad, session note và history đến theo độ ưu tiên. Timer không bounce và không
animate mỗi lần số giây đổi.

### Notes

Editor mở nhẹ từ trái, archive từ phải để diễn đạt quan hệ không gian. Templates
đến sau. Nội dung đang gõ, caret và trạng thái lưu không bị animation can thiệp.

## Launch Nook

| Pha | Delay | Duration | Kết thúc |
|---|---:|---:|---:|
| Ambient light | 0ms | 1.120ms | 1.120ms |
| Aperture | 0ms | 980ms | 980ms |
| Nook mark | 140ms | 860ms | 1.000ms |
| Wordmark | 520ms | 600ms | 1.120ms |
| Tagline | 680ms | 600ms | 1.280ms |
| Readable hold | đến tối thiểu 1.500ms | — | 1.500ms |
| Exit | 1.500ms | 420ms | khoảng 1.920ms |

Launch không báo tiến độ, không che một network request và không thay đổi theo
tốc độ tải giả định. Với `prefers-reduced-motion`, toàn bộ aperture choreography
được bỏ và chỉ giữ fade 140–150ms.

## Giới hạn kỹ thuật và kiểm thử

- Chỉ dùng transform, opacity, clip-path và filter trong vùng giới hạn; không
  animate width, height, top, left hoặc margin.
- Không thêm thư viện motion hay remote dependency.
- Mọi nội dung vẫn hiển thị nếu animation không chạy.
- Kiểm tra chuyển tab liên tiếp khi animation chưa kết thúc.
- Kiểm tra 390×844, tablet và desktop ở light/dark.
- Kiểm tra `prefers-reduced-motion: reduce`: không còn stagger hoặc chuyển động
  theo trục; focus và trạng thái vẫn rõ.
- Không đánh giá timing chỉ bằng video slow-motion; phải thao tác trực tiếp và
  đo computed style để xác nhận token thực tế.
