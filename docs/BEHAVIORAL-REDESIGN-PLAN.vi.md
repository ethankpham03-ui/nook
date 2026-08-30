# Kế hoạch thiết kế lại Nook theo hành vi người dùng

Trạng thái: định hướng nghiên cứu và lộ trình triển khai cho các vòng thiết kế tiếp theo.

## Kết luận ngắn

Nook không nên là năm bảng ô vuông độc lập. Mô hình phù hợp hơn là một vòng lặp có ngữ cảnh:

**Định hướng ở Trang chủ → xếp việc ở Hôm nay → làm một việc ở Tập trung → giữ thói quen → tổng kết và ghi chú → quay lại Trang chủ.**

Thanh tab vẫn giữ nguyên năm điểm đến cấp cao: Hôm nay, Thói quen, Trang chủ, Tập trung và Ghi chú. Mỗi màn hình chỉ nên có một nhiệm vụ chính, nhưng những dữ liệu có liên quan phải trở thành lối tắt có nhãn rõ ràng sang đúng chức năng. Nook không tự chuyển màn hình sau mỗi thao tác; người dùng vẫn giữ quyền quyết định.

Đây là kế hoạch dựa trên tài liệu nghiên cứu và phân tích sản phẩm hiện tại, chưa phải kết quả của một nghiên cứu eye-tracking riêng trên người dùng Nook. Các giả thuyết về thứ tự chú ý cần được xác nhận bằng kiểm thử tác vụ với người dùng thật.

## Cơ sở hành vi

### 1. Không có một đường nhìn F hoặc Z áp dụng cho mọi màn hình

Nghiên cứu eye-tracking trên nhiều loại giao diện cho thấy độ nổi bật chịu ảnh hưởng đồng thời bởi màu sắc, vị trí, loại giao diện và mục tiêu đang tìm kiếm. Một nghiên cứu dashboard khác còn ghi nhận ánh nhìn thực tế tập trung vào tiêu đề và chữ nhiều hơn biểu đồ, trái với dự đoán ban đầu. Vì vậy, Nook không nên xây bố cục quanh một “đường mắt” cố định; nên tạo thứ bậc theo tác vụ và kiểm tra trên đúng màn hình, đúng mục tiêu.

- [UEyes: Understanding Visual Saliency across User Interface Types](https://doi.org/10.1145/3544548.3581096)
- [User Perception and Eye Movement on a Pandemic Data Visualization Dashboard](https://pmc.ncbi.nlm.nih.gov/articles/PMC9874901/)

### 2. Trật tự thị giác quan trọng hơn việc chỉ giảm số ô

Một nghiên cứu eye-tracking về dashboard cho thấy bố cục có tổ chức tốt làm việc tìm kiếm bằng mắt hiệu quả hơn, kể cả khi lượng thông tin không đổi. Trong thí nghiệm đó, phần cốt lõi ở vùng trái–giữa cho kết quả nhanh hơn một số bố cục đặt giữa. Kết quả này không phải công thức cho mọi sản phẩm, nhưng ủng hộ việc Nook có một vùng hành động chính rõ ràng thay vì nhiều thẻ ngang cấp.

- [The Effects of Layout Order on Interface Complexity](https://www.mdpi.com/1424-8220/24/18/5966)

### 3. Cho người dùng nhận ra đích đến, đừng bắt họ nhớ tab nào chứa chức năng

Nhận ra thường nhẹ trí nhớ hơn tự nhớ lại. Nhãn liên kết, nội dung xung quanh và kinh nghiệm trước đó tạo nên “mùi thông tin”: người dùng sẽ chọn đường đi khi họ đoán được chính xác điều gì nằm sau thao tác đó. Vì vậy, “Tập trung” trong Hành trình hôm nay phải mở đúng phiên tập trung, và nếu có việc chính đang chờ thì phải mang việc đó theo.

- [Memory Recognition and Recall in User Interfaces](https://www.nngroup.com/articles/recognition-and-recall/)
- [Information Scent: How Users Decide Where to Go Next](https://www.nngroup.com/articles/information-scent/)
- [Information Foraging Models of Browsers](https://doi.org/10.1145/948496.948509)

### 4. Ghi dữ liệu ra giao diện giúp giảm gánh nặng ghi nhớ

“Cognitive offloading” là việc đưa thông tin ra môi trường để giảm yêu cầu xử lý trong đầu. Day Arc, việc chính đang chọn, ý nghĩ chen ngang và một dòng ghi chú cuối ngày nên đóng vai trò dấu nhắc bên ngoài; không nên chỉ là số liệu trang trí.

- [Cognitive Offloading](https://discovery.ucl.ac.uk/id/eprint/1508770/)

### 5. Chuyển ngữ cảnh có chi phí; dấu nhắc giúp quay lại nhanh hơn

Trong một thí nghiệm về gián đoạn tác vụ phức tạp, thời gian thực hiện hành động đầu tiên sau gián đoạn gần gấp đôi khoảng cách giữa các hành động bình thường. Dấu nhắc về trạng thái trước đó giúp giảm thời gian quay lại. Vì vậy, khi Today đưa một việc sang Focus, tên việc, thời lượng và trạng thái phải còn nguyên; khi rời Focus, Nook nên giữ một đường quay lại việc gốc.

- [Task Interruption: Resumption Lag and the Role of Cues](https://interruptions.net/literature/Altmann-CogSci04.pdf)

### 6. Kế hoạch cụ thể và ngữ cảnh ổn định hỗ trợ hành động

Implementation intentions nối một tình huống cụ thể với hành động cụ thể. Với Nook, việc chính không chỉ là “mục tiêu”; nó cần trở thành một hành động sẵn sàng bắt đầu. Thói quen cũng hình thành qua lặp lại trong ngữ cảnh ổn định, và một lần bỏ lỡ không làm hỏng quá trình. Điều này ủng hộ mức tối thiểu, lời nhắc theo ngữ cảnh và việc không dùng chuỗi ngày để gây áp lực.

- [Implementation Intentions: Strong Effects of Simple Plans](https://www.socmot.uni-konstanz.de/publications/implementation-intentions-strong-effects-simple-plans)
- [How Are Habits Formed: Modelling Habit Formation in the Real World](https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674)

### 7. Giữ quyền lựa chọn và cảm giác làm được

Self-Determination Theory nhấn mạnh autonomy, competence và relatedness. Trong một ứng dụng cá nhân như Nook, hai phần áp dụng trực tiếp nhất là quyền tự quyết và cảm giác tiến bộ có thật. Nook nên đề xuất bước tiếp theo nhưng không tự ép chuyển tab, không trừng phạt ngày bỏ lỡ, không biến tiến độ thành điểm số.

- [Self-Determination Theory and the Facilitation of Intrinsic Motivation](https://www.selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf)

### 8. Tab là điểm đến cấp cao, không phải nút hành động

Thanh tab giúp chuyển giữa các khu vực chính và giữ trạng thái điều hướng của từng khu vực. Các hành động cụ thể vẫn nằm trong nội dung. Nook đang có đúng năm điểm đến và nên giữ ổn định thứ tự đó; các liên kết trong nội dung chỉ rút ngắn đường đi đến chức năng liên quan.

- [Apple Human Interface Guidelines: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

## Mô hình chú ý đề xuất

### Desktop

1. **Vùng trái–giữa:** trạng thái hoặc nội dung cốt lõi của màn hình.
2. **Vùng phải:** một hành động tiếp theo nổi bật, không phải một thẻ dữ liệu ngang cấp.
3. **Phần dưới:** lịch sử, mẫu, phân tích hoặc chức năng ít dùng hơn.

### Mobile

1. Tiêu đề ngắn và trạng thái hiện tại.
2. Hành động tiếp theo hoàn chỉnh trước dock.
3. Tóm tắt hai cột hoặc danh sách; tránh bốn thẻ rất hẹp.
4. Công cụ phụ mở theo nhu cầu, không cạnh tranh với tác vụ chính.

### Nguyên tắc chung

- Chỉ một vùng dùng chartreuse để mời hành động tại một thời điểm.
- Lavender vẫn là trường màu rộng của Thói quen, không biến thành chip trang trí.
- Mỗi khối trả lời một câu hỏi: “Đang ở đâu?”, “Làm gì tiếp?”, hoặc “Xem chi tiết ở đâu?”.
- Mọi dấu hiệu có vẻ bấm được phải bấm được; số liệu chỉ đọc phải trông yên.
- Không tự đổi tab sau khi đánh dấu hoàn thành. Nook cập nhật bước tiếp theo và để người dùng chọn.

## Vai trò mới của từng tab

### Trang chủ — định hướng và tiếp tục

Mục tiêu: trong vài giây, người dùng biết hôm nay đang ở bước nào và có một đường đi rõ ràng.

- Hành trình hôm nay là một tuyến bốn bước có thể bấm: Lên kế hoạch, Tập trung, Giữ thói quen, Tổng kết.
- “Việc nên làm tiếp” là vùng hành động chính, thay đổi theo dữ liệu thật.
- Nhìn lại 7 ngày là tầng phụ; từng số liệu mở đúng màn hình nguồn.
- Không sao chép biểu mẫu tạo việc, danh sách thói quen hoặc trình soạn ghi chú lên Trang chủ.

### Hôm nay — bàn xếp việc

Mục tiêu: quyết định hôm nay nhận bao nhiêu việc và việc nào đi trước.

- Quỹ thời gian và mức đã xếp là khung quyết định ở đầu màn hình.
- Việc chính là vùng nổi bật nhất; việc hỗ trợ và “Nếu còn thời gian” nằm sau theo thứ tự.
- Thêm việc là một luồng ngắn, ưu tiên nhập tên trước; nhóm, thời lượng và vị trí vẫn rõ nhưng không cùng tranh sự chú ý.
- Nút Tập trung trên từng việc chuyển sang Focus cùng `taskId`, tên và thời lượng.
- Khi chưa có quỹ thời gian, lời nhắc mở trực tiếp phần Lên kế hoạch thay vì chỉ báo thiếu dữ liệu.

### Thói quen — nghi thức nhỏ của hôm nay

Mục tiêu: làm phiên bản nhỏ nhất có thể duy trì, không theo đuổi điểm số.

- Danh sách hôm nay là phần chính trên trường lavender.
- Mức tối thiểu hiện ngay cạnh tên thói quen để hành động cụ thể, không mơ hồ.
- Nhịp 7 ngày nằm phía sau để nhìn lại, không dùng streak và không tô đỏ ngày bỏ lỡ.
- Sau khi đánh dấu, Home tự cập nhật Hành trình hôm nay; không tự chuyển màn hình.
- Ở giai đoạn sau có thể cho phép mở ghi chú của ngày từ ô lịch sử, nhưng chỉ khi ghi chú thực sự tồn tại.

### Tập trung — một ngữ cảnh, một việc

Mục tiêu: giảm chuyển tác vụ và giúp quay lại nhanh sau gián đoạn.

- Tên việc được chuyển từ Today trở thành tiêu đề ngữ cảnh phía trên timer.
- Timer là vùng duy nhất có độ tương phản cao và glow đặc trưng.
- “Để lại cho sau” là thao tác ghi nhanh, không dẫn người dùng ra khỏi phiên.
- Ghi chú phiên giữ dấu nhắc “lần tới tiếp tục từ đâu”.
- Sau phiên, hiển thị hai lựa chọn rõ: về Trang chủ để xem bước tiếp theo, hoặc xem việc gốc trong Hôm nay. Không tự chuyển.

### Ghi chú — viết và tìm lại

Mục tiêu: ghi nhanh hôm nay nhưng vẫn tìm được ghi chú cũ.

- Desktop dùng bố cục editor chính + kho ghi chú phụ; mobile là một luồng đơn, kho mở khi cần.
- Ngày đang viết và trạng thái lưu luôn nhìn thấy.
- Mẫu chỉ chèn cấu trúc; không tạo nội dung thay người dùng.
- Ghi chú từ Tổng kết ngày mở đúng ngày hiện tại; khi đến từ Home nên giữ dấu vết “Từ tổng kết hôm nay”.
- Kết quả tìm kiếm mở đúng ngày và đưa con trỏ vào editor, không chỉ đổi danh sách.

## Bản đồ liên kết giữa các tab

| Nguồn | Hành động | Đích | Ngữ cảnh cần mang theo |
|---|---|---|---|
| Home · Lên kế hoạch | Bấm bước | Hôm nay | Ngày hiện tại; tập trung phần lập kế hoạch |
| Home · Tập trung | Bấm bước | Tập trung | `taskId` của việc chính chưa xong nếu có |
| Home · Giữ thói quen | Bấm bước | Thói quen | Ngày hiện tại |
| Home · Tổng kết | Bấm bước | Hộp tổng kết; nếu đã xong thì Ghi chú | Ngày hiện tại |
| Home · số việc 7 ngày | Bấm số liệu | Hôm nay | Bộ lọc ngày hiện tại trước; lịch sử là bước sau |
| Home · thời gian tập trung | Bấm số liệu | Tập trung | Cuộn đến lịch sử 7 ngày |
| Home · lần làm thói quen | Bấm số liệu | Thói quen | Cuộn đến nhịp 7 ngày |
| Home · ngày có ghi chú | Bấm số liệu | Ghi chú | Mở kho ghi chú |
| Today · Tập trung | Bấm trên một việc | Tập trung | `taskId`, tên, thời lượng, vị trí |
| Focus · xem việc gốc | Bấm liên kết ngữ cảnh | Hôm nay | `taskId`; cuộn và làm nổi việc tương ứng |
| Close Day · mở ghi chú | Hoàn tất tổng kết | Ghi chú khi người dùng chọn | Ngày vừa tổng kết |

Về kỹ thuật, giai đoạn tiếp theo nên thay `onNavigate(tab)` đơn thuần bằng một `NavigationIntent` cục bộ:

```ts
type NavigationIntent = {
  tab: Tab;
  target?: 'capacity' | 'anchor' | 'history' | 'archive' | 'task';
  entityId?: string;
  returnTo?: Tab;
};
```

Intent chỉ điều khiển giao diện trong bộ nhớ/trình duyệt, không thay đổi mô hình local-first và không gửi dữ liệu ra ngoài.

## Hướng viết tiếng Việt

Microsoft khuyến nghị bản địa hóa theo bối cảnh, giọng rõ ràng, thân thiện và lấy người dùng làm trung tâm, thay vì dịch từng chữ. Nook áp dụng các quy tắc sau:

- Dịch theo mục đích của câu, không giữ ẩn dụ tiếng Anh nếu tiếng Việt nghe gượng.
- Nút bắt đầu bằng động từ cụ thể: “Thêm việc”, “Bắt đầu”, “Tổng kết ngày”.
- Trạng thái nói điều đã xảy ra: “Đã lưu”, “Chưa có phiên tập trung”.
- Câu ngắn, chủ động; lược “bạn” khi ngữ cảnh đã rõ.
- Dùng sentence case; không viết hoa thuật ngữ giữa câu trừ tên mục điều hướng hoặc tên sản phẩm.
- Placeholder đưa ví dụ hoặc gợi đúng loại câu trả lời, không lặp lại nhãn.
- Lỗi luôn có vấn đề + cách xử lý.
- Nhãn hỗ trợ đọc màn hình phải đầy đủ hơn nhãn nhìn thấy.
- Kiểm tra độ dài thực tế ở desktop và mobile; không rút câu đến mức mất nghĩa chỉ để vừa ô.

- [Microsoft Vietnamese Localization Style Guide](https://download.microsoft.com/download/b/f/e/bfecb1b4-21ab-48fd-a48c-c2471b026f8f/vie-vnm-StyleGuide.pdf)

### Thuật ngữ thống nhất

| Khái niệm | Bản cũ dễ gượng | Bản dùng trong Nook |
|---|---|---|
| Capacity | Sức chứa | Quỹ thời gian |
| Anchor | Anchor / Việc neo | Việc chính |
| Day Arc | Nhịp ngày | Hành trình hôm nay |
| Next quiet move | Bước nhẹ tiếp theo | Việc nên làm tiếp |
| Tend | Duy trì | Giữ thói quen |
| Close | Khép lại | Tổng kết |
| Minimum version | Phiên bản tối thiểu | Mức tối thiểu |
| Distraction pad | Khay ý nghĩ tạm | Để lại cho sau |
| Focus intention | Ý định | Việc đang làm |
| Archive | Kho lưu | Kho ghi chú |

## Lộ trình triển khai

### Giai đoạn 0 — đã thực hiện trong thay đổi hiện tại

- Day Arc trở thành bốn hành động có bàn phím, nhãn hỗ trợ đọc màn hình và đích đến theo trạng thái.
- Tập trung mang theo việc chính đang chờ nếu có.
- Tổng kết mở hộp thoại khi ngày chưa đóng; sau khi đóng, cùng vị trí mở ghi chú hôm nay.
- Bốn số liệu “Nhìn lại 7 ngày” mở đúng tab nguồn.
- Viết lại toàn bộ bản tiếng Việt và thống nhất thuật ngữ.

### Giai đoạn 1 — tái cấu trúc Home

- Chuyển Day Arc từ bốn ô ngang cấp thành một tuyến có bước hiện tại rõ.
- Giữ toàn bộ “Việc nên làm tiếp” trong viewport đầu ở 390 × 844.
- Thử hai biến thể: tuyến ngang ngắn trên desktop / tuyến 2 × 2 trên mobile, so với tuyến dọc; chọn bằng kiểm thử tác vụ.

### Giai đoạn 2 — điều hướng có ngữ cảnh

- Thêm `NavigationIntent`, focus target và return path.
- Giữ vị trí cuộn và nội dung nhập dở của từng tab.
- Làm nổi mục tiêu trong thời gian ngắn khi đến từ liên kết sâu; tôn trọng reduced motion.

### Giai đoạn 3 — thiết kế lại từng không gian

Làm lần lượt Today → Focus → Habits → Notes để vòng hành vi có thể được kiểm thử sau từng bước. Không thay cả năm màn hình trong một lần vì sẽ khó biết thay đổi nào thực sự tốt hơn.

### Giai đoạn 4 — kiểm thử hành vi

Thực hiện 5–8 phiên kiểm thử có người điều phối với người dùng phù hợp, trên cả desktop và điện thoại. Dữ liệu nghiên cứu được ghi thủ công cho phiên kiểm thử; không thêm analytics vào sản phẩm.

Các tác vụ:

1. Lên kế hoạch cho một ngày 180 phút và thêm một việc chính.
2. Từ Home, bắt đầu đúng việc chính trong Focus.
3. Ghi một ý nghĩ chen ngang rồi tiếp tục phiên.
4. Đánh dấu một thói quen ở mức tối thiểu.
5. Tổng kết ngày và tìm lại ghi chú.
6. Từ một số liệu 7 ngày, mở đúng chi tiết nguồn.

Chỉ số cần quan sát:

- Tỷ lệ chọn đúng hành động đầu tiên.
- Thời gian từ Home đến lúc sẵn sàng bấm Start trong Focus.
- Số lần đi sai tab hoặc quay lại.
- Khả năng nói đúng Day Arc dùng để làm gì.
- Khả năng tiếp tục việc sau khi chuyển tab.
- Câu chữ nào khiến người dùng dừng lại hoặc hỏi nghĩa.

## Tiêu chí hoàn tất

- Giữ đúng năm tab và thứ tự hiện tại.
- Home vẫn là launchpad ngắn, không trở thành trang chứa mọi tính năng.
- Tất cả liên kết sâu hoạt động bằng chuột, cảm ứng và bàn phím.
- Trạng thái và dữ liệu nhập dở không mất khi chuyển tab.
- Không tự khởi động timer, tự đóng ngày hoặc tự đánh dấu hành vi.
- Không có tài khoản, telemetry, remote API, font hoặc ảnh từ xa.
- Tiếng Việt không tràn hoặc bị cắt ở 390 × 844, 768 × 1024 và desktop.
- Light/dark, reduced motion, forced colors và focus visible đều được kiểm tra.
- Lint, typecheck, test và production build đều đạt.
