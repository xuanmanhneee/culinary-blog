# BÁO CÁO MÔN HỌC CULINARY BLOG

Website chia sẻ công thức nấu ăn

Môn học, giảng viên, lớp, nhóm và thành viên: [Tự điền].

<!-- page -->
# CHƯƠNG 1 TỔNG QUAN ĐỀ TÀI

## 1.1 Lý do lựa chọn đề tài

Công thức nấu ăn là một dạng nội dung có cả thông tin mô tả và trình tự thực hiện. Để có thể áp dụng một công thức, người đọc cần biết nguyên liệu, lượng dùng, thời gian chuẩn bị và thứ tự chế biến. Nếu những thông tin này được trình bày rời rạc, việc theo dõi và tìm lại món ăn sẽ gặp nhiều bất tiện. Từ nhu cầu đó, nhóm lựa chọn xây dựng Culinary Blog, một website hỗ trợ chia sẻ và tra cứu công thức nấu ăn theo cấu trúc thống nhất.

Đề tài cũng tạo điều kiện vận dụng những kiến thức của môn học vào một ứng dụng có nhiều thành phần liên quan. Một thao tác đăng công thức đòi hỏi sự phối hợp giữa giao diện nhập liệu, xử lý nghiệp vụ, lưu trữ dữ liệu và kiểm tra quyền của người dùng. Vì vậy, việc thực hiện đề tài giúp nhóm tiếp cận quá trình xây dựng một sản phẩm chung thay vì chỉ hoàn thành các màn hình riêng lẻ.

## 1.2 Mục tiêu của đề tài

Mục tiêu của Culinary Blog là hình thành một không gian để người dùng tìm kiếm, đọc và chia sẻ công thức nấu ăn. Nội dung mỗi công thức được tổ chức thành các phần rõ ràng, giúp người đọc nắm được yêu cầu chuẩn bị và theo dõi quá trình thực hiện. Đối với tác giả, website cung cấp khu vực quản lý riêng để biên soạn, chỉnh sửa và quyết định thời điểm công khai nội dung.

Về mặt học tập, nhóm hướng đến việc kết nối được giao diện web với backend và cơ sở dữ liệu, đồng thời vận dụng phân quyền, kiểm tra dữ liệu và quản lý mã nguồn trong quá trình thực hiện. Sản phẩm được đánh giá qua các chức năng đã cài đặt, mức độ liên kết giữa các phần và kết quả kiểm tra tương ứng.

<!-- page -->
## 1.3 Phạm vi thực hiện

Phạm vi của đề tài được xác định quanh hai hoạt động chính là khai thác và đóng góp nội dung. Người đọc tiếp cận các công thức đã xuất bản thông qua danh sách, tìm kiếm và bộ lọc. Tác giả thực hiện đăng ký, đăng nhập và quản lý công thức do mình tạo. Quản trị viên quản lý danh mục và người dùng để hỗ trợ tổ chức nội dung chung của website.

Một công thức gồm thông tin giới thiệu món ăn, thời gian, khẩu phần, nguyên liệu, hướng dẫn thực hiện và hình ảnh. Thông tin dinh dưỡng được bổ sung khi tác giả có dữ liệu phù hợp. Bên cạnh nội dung chính, chức năng lưu công thức và đánh giá được triển khai để người dùng ghi lại những món quan tâm và thể hiện nhận xét bằng điểm số.

Nhóm giới hạn sản phẩm ở ứng dụng web. Các chức năng bình luận, nhắn tin, thanh toán và ứng dụng di động riêng chưa thuộc phiên bản được báo cáo. Việc giới hạn phạm vi giúp công việc tập trung vào hành trình từ biên soạn đến công khai và sử dụng công thức.

## 1.4 Phương pháp thực hiện

Nhóm bắt đầu từ tài liệu đặc tả của đề tài [1] để xác định các chức năng trọng tâm và chia công việc. Trên cơ sở đó, mô hình dữ liệu và cách kết nối giữa giao diện với backend được xây dựng trước khi hoàn thiện các màn hình sử dụng. Các phần cài đặt sau đó được ghép lại theo từng luồng nghiệp vụ, chẳng hạn đăng nhập, tạo công thức và xuất bản.

Trong quá trình tích hợp, mã nguồn và cấu hình thực tế được dùng để đối chiếu hành vi của chương trình. Kết quả được tổng hợp theo phần đã cài đặt, phần chưa hoàn tất và phạm vi kiểm tra đã thực hiện. Cách tiếp cận này là cơ sở để đánh giá sản phẩm ở Chương 4 và xác định hướng hoàn thiện ở cuối báo cáo.

<!-- page -->
# CHƯƠNG 2 PHÂN TÍCH VÀ THIẾT KẾ

## 2.1 Lựa chọn Modular Monolith cho backend chính

Nhóm lựa chọn Modular Monolith, tức một ứng dụng backend được tổ chức thành các mô đun nghiệp vụ. Những phần như tài khoản, danh mục và công thức có phạm vi mã nguồn rõ ràng nhưng vẫn chạy trong cùng backend chính và sử dụng chung cơ sở dữ liệu lõi. Lựa chọn này là một quyết định về cách tổ chức chương trình, không chỉ là cách đặt tên thư mục [2], [5].

Lý do giữ các nghiệp vụ lõi trong cùng ứng dụng là chúng có nhiều quan hệ trực tiếp. Một công thức cần tác giả, danh mục, nguyên liệu và bước thực hiện. Nếu tách toàn bộ thành các dịch vụ riêng, một thao tác có thể phải kết nối nhiều nơi và phát sinh thêm công việc đồng bộ. Trong phạm vi môn học, giữ các phần này cùng nhau giúp nhóm tập trung vào chức năng và tích hợp.

## 2.2 Kết hợp phân tầng với phân chia theo mô đun

Modular Monolith được kết hợp với cách phân tầng API, Application, Domain và Infrastructure của Clean Architecture. Phân tầng xác định trách nhiệm kỹ thuật, còn mô đun xác định nhóm nghiệp vụ. Chẳng hạn, những phần tiếp nhận yêu cầu, xử lý và lưu dữ liệu của công thức cùng phục vụ nghiệp vụ Recipes, dù nằm ở các tầng khác nhau.

Cách tổ chức này giúp thành viên theo dõi một chức năng từ giao diện đến dữ liệu và giới hạn phạm vi cần sửa. Tuy nhiên, các mô đun lõi chưa phải những dịch vụ triển khai độc lập vì vẫn dùng chung ứng dụng và cơ sở dữ liệu. Đây là ranh giới được giữ trong thiết kế hiện tại để phù hợp với quy mô và thời gian thực hiện đề tài.

<!-- page -->
## 2.3 Kết hợp dịch vụ Engagement với backend lõi

Bên cạnh Modular Monolith, nhóm tách chức năng lưu công thức và đánh giá thành dịch vụ Engagement. Đây là phần áp dụng cách tổ chức Microservices trong phạm vi hẹp: Engagement chạy riêng, có cơ sở dữ liệu riêng và kiểm tra công thức thông qua API thay vì truy cập trực tiếp các bảng của backend lõi.

[[DIAGRAM architecture]]

Hình 2.1 Backend lõi theo Modular Monolith kết hợp dịch vụ Engagement

Việc chọn phần tương tác để tách xuất phát từ trách nhiệm dữ liệu của nó. Lưu công thức và đánh giá ghi nhận hành động của người dùng đối với nội dung đã xuất bản, trong khi backend lõi quản lý chính nội dung đó. Ranh giới này giúp nhóm thực hành chia dịch vụ và quyền sở hữu dữ liệu mà vẫn giữ các nghiệp vụ công thức có quan hệ chặt trong cùng ứng dụng.

Giao diện tiếp tục sử dụng API chính làm điểm vào; các yêu cầu lưu và đánh giá được chuyển tiếp đến Engagement. Kiến trúc vì vậy kết hợp một lõi tập trung theo mô đun với một dịch vụ tách riêng. Đổi lại, môi trường chạy có thêm dịch vụ và cơ sở dữ liệu cần cấu hình, kiểm tra kết nối.

<!-- page -->
## 2.4 Thiết kế dữ liệu

Mô hình dữ liệu được xây dựng quanh thực thể công thức. Một công thức gắn với một tác giả và một danh mục; các nguyên liệu, bước thực hiện và ảnh được lưu thành những thành phần liên quan. Cách tổ chức này phản ánh trực tiếp cấu trúc của nội dung nấu ăn và cho phép chỉnh sửa từng phần mà vẫn xác định được công thức sở hữu chúng.

[[DIAGRAM data]]

Hình 2.2 Quan hệ giữa các nhóm dữ liệu chính

Nguyên liệu cần lưu tên, lượng dùng, đơn vị và thứ tự hiển thị. Các bước thực hiện có số thứ tự, tiêu đề và nội dung hướng dẫn. Ảnh lưu thông tin liên quan cùng đường dẫn đến tệp, còn nội dung tệp được quản lý bởi thành phần lưu trữ. Thông tin chung như tiêu đề, thời gian và khẩu phần thuộc về công thức để có thể sử dụng khi hiển thị danh sách hoặc trang chi tiết.

Dữ liệu tài khoản được liên kết với nội dung nhằm xác định tác giả và kiểm tra quyền quản lý. Dữ liệu món đã lưu và đánh giá xác định cả người thực hiện lẫn công thức được tương tác. Do được đặt ở cơ sở dữ liệu riêng, quan hệ của Engagement với công thức được xác định bằng mã định danh và lời gọi API, không phải khóa ngoại giữa hai cơ sở dữ liệu.

<!-- page -->
## 2.5 Thiết kế giao diện và luồng nội dung

Giao diện được chia thành khu vực công khai và khu vực quản lý. Khu vực công khai phục vụ việc khám phá món ăn, vì vậy danh sách công thức sử dụng tên món, ảnh đại diện và thông tin tóm tắt để người đọc lựa chọn. Trang chi tiết trình bày đầy đủ hơn theo trình tự giới thiệu, nguyên liệu và hướng dẫn thực hiện. Cách sắp xếp này tương ứng với quá trình người đọc quyết định chọn món rồi bắt đầu chuẩn bị.

Khu vực quản lý phục vụ nhu cầu biên tập. Danh sách tại đây cần thể hiện được trạng thái công thức và các thao tác liên quan, thay vì chỉ giới thiệu nội dung như ở trang công khai. Tác giả có thể phân biệt bản nháp với công thức đã xuất bản và tiếp tục chỉnh sửa từ đúng nội dung đã lưu.

Biểu mẫu tạo công thức được chia thành các bước thông tin cơ bản, nguyên liệu, hướng dẫn và xem lại. Lựa chọn này xuất phát từ số lượng thông tin cần nhập cho một món ăn. Nếu đưa toàn bộ vào một biểu mẫu dài, người dùng khó theo dõi phần đã hoàn thành và phần còn thiếu. Việc chia bước tạo cấu trúc rõ ràng hơn nhưng vẫn cần bảo đảm dữ liệu được giữ khi chuyển giữa các phần.

## 2.6 Kiểm soát thao tác trên giao diện

Trạng thái đăng nhập và quyền của tài khoản được dùng để hiển thị những thao tác phù hợp. Chẳng hạn, khách truy cập có thể đọc công thức đã xuất bản nhưng cần đăng nhập để sử dụng chức năng cá nhân. Tác giả nhìn thấy các thao tác quản lý trên nội dung thuộc quyền của mình. Các kiểm tra ở giao diện hỗ trợ trải nghiệm sử dụng, còn quyền cuối cùng vẫn được xác nhận tại backend.

Thiết kế giao diện vì vậy không chỉ là sắp xếp các thành phần hiển thị. Nó còn thể hiện trạng thái nội dung và kết quả của quá trình xử lý, giúp người dùng nhận biết công việc đang thực hiện đã được chấp nhận hay cần điều chỉnh.

<!-- page -->
# CHƯƠNG 3 TỔ CHỨC VÀ TRIỂN KHAI

## 3.1 Phân công công việc

Công việc được chia theo các nhóm chức năng để mỗi phần có phạm vi phụ trách rõ ràng. Bên cạnh phần cài đặt riêng, các thành viên cùng tham gia tích hợp giao diện với backend và hoàn thiện phiên bản chung. Bảng 3.1 tổng hợp nhiệm vụ và sản phẩm bàn giao của từng nhóm công việc.

| Thành viên và MSSV | Nhiệm vụ chính | Sản phẩm bàn giao | Kết quả |
|---|---|---|---|
| [Họ tên 1]<br>[MSSV 1] | Tổ chức cấu trúc dự án, kết nối dữ liệu và tích hợp các phần | Cấu hình chạy, cơ sở dữ liệu và các thành phần hỗ trợ dùng chung | Đã cài đặt |
| [Họ tên 2]<br>[MSSV 2] | Xây dựng chức năng quản lý công thức | Danh sách quản lý, biểu mẫu, nguyên liệu, các bước và trạng thái công thức | Đã cài đặt |
| [Họ tên 3]<br>[MSSV 3] | Xây dựng tìm kiếm, xử lý ảnh và nội dung công khai | Tìm kiếm, lọc, trang chi tiết và tải ảnh | Đã cài đặt |
| [Họ tên 4]<br>[MSSV 4] | Xây dựng tài khoản, phân quyền và danh mục | Đăng ký, đăng nhập, kiểm tra quyền và quản lý danh mục | Đã cài đặt |
| Cả nhóm | Tích hợp, bổ sung tương tác, kiểm tra và tổng hợp kết quả | Phiên bản chung, chức năng lưu và đánh giá, báo cáo | Còn xác nhận đầy đủ luồng demo |

Bảng 3.1 Phân công công việc của nhóm

Việc phân chia theo chức năng không tạo ra các phần độc lập hoàn toàn. Chức năng công thức sử dụng tài khoản và danh mục; trang công khai sử dụng dữ liệu do khu vực quản lý tạo ra; chức năng tương tác cần xác định được công thức đã xuất bản. Các mối liên hệ này là lý do việc tích hợp được thực hiện ở phạm vi chung của nhóm.

<!-- page -->
## 3.2 Quá trình thực hiện

Quá trình thực hiện được tổ chức từ phần nền tảng đến các chức năng sử dụng. Trước hết, nhóm xác định các dữ liệu chính và thiết lập kết nối với PostgreSQL. Các thành phần tiếp nhận yêu cầu và xử lý nghiệp vụ được hình thành để làm cơ sở cho việc cài đặt tài khoản, danh mục và công thức. Cấu trúc dữ liệu ban đầu được quản lý cùng mã nguồn để các thành viên có thể áp dụng khi chạy trên máy của mình.

Sau phần nền tảng, các nhóm chức năng được phát triển ở backend và giao diện tương ứng. Đối với công thức, việc triển khai đi từ thông tin chung đến nguyên liệu, bước thực hiện và ảnh. Đối với tài khoản, phần xử lý đăng nhập được kết nối với phiên sử dụng ở giao diện. Trang danh sách và chi tiết sau đó khai thác các dữ liệu này để tạo thành khu vực công khai.

Giai đoạn tích hợp tập trung vào việc thống nhất dữ liệu trao đổi và hoàn thiện phản hồi cho người dùng. Một màn hình có thể hiển thị đúng bố cục nhưng vẫn chưa thực hiện được nghiệp vụ nếu yêu cầu gửi đi không phù hợp với backend. Vì vậy, việc đối chiếu được thực hiện ở cả thông tin đầu vào, kết quả trả về và dữ liệu đã lưu.

## 3.3 Quản lý và phối hợp mã nguồn

Git được sử dụng để lưu lịch sử thay đổi và hợp nhất công việc vào kho mã nguồn chung [2]. Cách tổ chức theo thư mục chức năng giúp các thành viên xác định được phần liên quan khi cần điều chỉnh. Những thay đổi ảnh hưởng nhiều thành phần, như thông tin tài khoản hoặc cấu trúc công thức, cần được thống nhất để tránh mỗi phần sử dụng một cách hiểu khác nhau.

Qua quá trình ghép các phần, nhóm nhận thấy kết quả của từng thành viên chỉ có ý nghĩa đầy đủ khi được đặt trong luồng sử dụng chung. Đây cũng là cơ sở để phần đánh giá kết quả phân biệt giữa hoàn thành cài đặt và xác nhận hoạt động trên toàn bộ môi trường.

<!-- page -->
## 3.4 Triển khai các chức năng chính

Chức năng tài khoản được xây dựng trước hết để xác định người thực hiện các thao tác có quyền. Backend kiểm tra thông tin đăng nhập và cung cấp thông tin xác thực cho các yêu cầu tiếp theo. Ở giao diện, phiên đăng nhập được dùng để duy trì trạng thái sử dụng giữa các trang. Người dùng mới còn có luồng xác nhận email trước khi thực hiện các thao tác quản lý công thức theo chính sách của chương trình.

Phần quản lý công thức được triển khai theo vòng đời của nội dung. Công thức được tạo ở trạng thái nháp, bổ sung nguyên liệu, bước thực hiện và ảnh, sau đó mới xuất bản. Tác giả có thể mở lại để chỉnh sửa hoặc thay đổi trạng thái. Các thao tác ghi dữ liệu đều gắn với tài khoản thực hiện để bảo đảm chỉ người có quyền mới quản lý được nội dung tương ứng.

Tìm kiếm được xử lý tại backend, kết hợp từ khóa với các điều kiện lọc và phân trang. Giao diện nhận kết quả để hiển thị danh sách phù hợp. Việc hỗ trợ tiếng Việt có ý nghĩa đối với đề tài vì tên món và nội dung công thức chủ yếu được nhập bằng tiếng Việt; khả năng tìm kiếm giúp khai thác dữ liệu thuận tiện hơn việc duyệt tuần tự toàn bộ danh sách.

## 3.5 Triển khai các phần hỗ trợ

Ảnh được tiếp nhận qua chức năng tải tệp và quản lý bằng thành phần lưu trữ riêng. Cơ sở dữ liệu giữ thông tin ảnh cùng đường dẫn cần dùng khi hiển thị. Các tác vụ như gửi email và xử lý ảnh có phần hỗ trợ chạy nền, giảm việc đưa toàn bộ công việc vào cùng một thao tác trên giao diện.

Chức năng lưu công thức và đánh giá được bổ sung trong Engagement. Mỗi tương tác gắn với tài khoản đang đăng nhập và công thức được chọn. Điểm đánh giá được giới hạn từ 1 đến 5; một người dùng cập nhật điểm của mình thay vì tạo nhiều lượt độc lập cho cùng công thức. Cách xử lý này giữ được ý nghĩa của dữ liệu tương tác cá nhân.

<!-- page -->
## 3.6 Các điều chỉnh khi hoàn thiện chương trình

Một thay đổi trong cách cài đặt là chuyển các nghiệp vụ chính từ Service pattern sang CQRS qua MediatR. Các ghi chú thiết kế trước đây còn mô tả phương án giữ Service pattern, trong khi mã nguồn hiện tại đã tách yêu cầu đọc và ghi thành những phần xử lý riêng. Ví dụ, tìm kiếm công thức và xuất bản công thức được tổ chức theo từng công việc cụ thể, vẫn dùng chung cơ sở dữ liệu lõi.

Sự điều chỉnh này giúp việc phân chia mã theo thao tác rõ hơn và đưa kiểm tra dữ liệu vào luồng xử lý chung. Ở frontend, việc quản lý phiên được tập trung vào Auth.js; backend tiếp tục kiểm tra token và quyền của từng yêu cầu. Nhờ đó, trạng thái đăng nhập được quản lý thống nhất khi chuyển giữa các trang và gọi chức năng cần quyền.

## 3.7 Điều chỉnh luồng dữ liệu khi tích hợp

Nhóm cũng thống nhất dữ liệu trao đổi và cách trả lỗi giữa giao diện với backend. Biểu mẫu đăng ký phải gửi đúng các trường được yêu cầu, danh sách phải đọc đúng cấu trúc phân trang, còn lỗi nhập liệu cần được đưa về trường tương ứng. Những điều chỉnh này giải quyết sai lệch giữa các phần do nhiều thành viên triển khai.

Với công thức được mở sửa ở nhiều nơi, chương trình bổ sung kiểm tra phiên bản trước khi cập nhật. Nếu nội dung đang sửa đã cũ, người dùng được yêu cầu tải lại để tránh ghi đè thay đổi mới hơn. Các điều chỉnh trên cho thấy việc hoàn thiện sản phẩm còn bao gồm sửa cách tổ chức và phối hợp xử lý, bên cạnh bổ sung chức năng.

<!-- page -->
# CHƯƠNG 4 KẾT QUẢ VÀ ĐÁNH GIÁ

## 4.1 Kết quả thực hiện các chức năng

Kết quả chính của đề tài là hình thành các nhóm chức năng liên quan đến đọc, biên soạn và quản lý công thức nấu ăn. Bảng 4.1 tổng hợp phần đã được cài đặt trong mã nguồn. Phạm vi kiểm tra và các phần còn chưa hoàn tất được trình bày tại mục 4.6 và 4.7.

| Nhóm chức năng | Kết quả thực hiện | Trạng thái |
|---|---|---|
| Tổ chức kiến trúc | Backend lõi theo Modular Monolith, kết hợp dịch vụ Engagement và dữ liệu tương tác riêng | Hoàn thành cài đặt |
| Tài khoản và phân quyền | Đăng ký, đăng nhập, xác nhận email và kiểm tra quyền theo tài khoản | Hoàn thành cài đặt |
| Danh mục | Hiển thị và quản lý danh mục món ăn | Hoàn thành cài đặt |
| Quản lý công thức | Tạo, xem, sửa, xóa và thay đổi trạng thái nội dung | Hoàn thành cài đặt |
| Thành phần công thức | Nguyên liệu, bước thực hiện, ảnh và thông tin dinh dưỡng | Hoàn thành cài đặt |
| Khai thác nội dung | Danh sách, tìm kiếm tiếng Việt, lọc, phân trang và trang chi tiết | Hoàn thành cài đặt |
| Tương tác cá nhân | Lưu, bỏ lưu công thức và đánh giá từ 1 đến 5 sao | Hoàn thành cài đặt |
| Quản trị | Quản lý danh mục và người dùng theo quyền | Hoàn thành cài đặt |
| Môi trường chạy | Cấu hình Docker Compose, dữ liệu mẫu, lưu ảnh và email thử | Đã có cấu hình |

Bảng 4.1 Tổng hợp kết quả cài đặt

Các chức năng trên tạo thành một chu trình nội dung: tác giả biên soạn, công thức được xuất bản, người đọc tìm kiếm và sử dụng, sau đó có thể lưu hoặc đánh giá. Kết quả này đáp ứng phần trọng tâm của đề tài, đồng thời tạo cơ sở để kiểm tra sự phối hợp giữa các thành phần thay vì chỉ xem xét từng màn hình riêng lẻ.

<!-- page -->
## 4.2 Kết quả xây dựng giao diện công khai

Khu vực công khai được tổ chức để người đọc tiếp cận món ăn từ thông tin tóm tắt đến nội dung đầy đủ. Trên trang danh sách, tên món và ảnh đại diện giúp nhận diện nội dung; tìm kiếm và bộ lọc hỗ trợ thu hẹp phạm vi lựa chọn. Kết quả giao diện thể hiện cách dữ liệu công thức được chuyển thành những thông tin có thể tra cứu và so sánh.

[[SCREENSHOT 4.1|Trang danh sách và tìm kiếm công thức|]]

Hình 4.1 Giao diện danh sách và tìm kiếm công thức

Trang chi tiết trình bày nội dung theo cấu trúc đã xác định trong thiết kế. Nguyên liệu và hướng dẫn được tách thành từng phần, giúp người đọc theo dõi theo trình tự chế biến. Việc sử dụng cùng một cấu trúc cho các công thức cũng tạo sự nhất quán khi chuyển giữa những món ăn khác nhau.

[[SCREENSHOT 4.2|Trang chi tiết công thức|]]

Hình 4.2 Giao diện chi tiết công thức nấu ăn

<!-- page -->
## 4.3 Kết quả xây dựng khu vực tác giả

Chức năng đăng nhập là điểm kết nối giữa khu vực công khai với các thao tác cá nhân. Sau khi xác thực, giao diện nhận biết tài khoản sử dụng để hiển thị chức năng phù hợp. Nhờ đó, phần đọc nội dung và phần biên tập vẫn nằm trong cùng website nhưng có phạm vi thao tác khác nhau.

[[SCREENSHOT 4.3|Màn hình đăng nhập|]]

Hình 4.3 Giao diện đăng nhập tài khoản

Danh sách quản lý tập hợp những công thức thuộc phạm vi của tác giả, kèm trạng thái và thao tác biên tập. Kết quả này thể hiện việc sử dụng thông tin quyền và trạng thái nội dung trong giao diện, đồng thời tạo điểm bắt đầu cho quá trình bổ sung hoặc điều chỉnh công thức đã lưu.

[[SCREENSHOT 4.4|Danh sách công thức của tác giả|]]

Hình 4.4 Giao diện quản lý công thức của tác giả

<!-- page -->
## 4.4 Kết quả xây dựng biểu mẫu công thức

Biểu mẫu nhiều bước cụ thể hóa cách chia nội dung đã nêu ở phần thiết kế. Các thông tin chung được nhập trước để xác định món ăn, sau đó tác giả bổ sung nguyên liệu và hướng dẫn. Cách tổ chức này giúp mỗi màn hình tập trung vào một nhóm dữ liệu thay vì đặt toàn bộ nội dung trên cùng một biểu mẫu dài.

[[SCREENSHOT 4.5|Biểu mẫu thông tin cơ bản của công thức|]]

Hình 4.5 Giao diện nhập thông tin cơ bản

Ở phần nội dung chi tiết, nguyên liệu có số lượng và đơn vị, còn hướng dẫn được chia thành các bước có thứ tự. Dữ liệu nhập theo cấu trúc này được sử dụng lại ở trang chi tiết công khai. Sự tương ứng giữa biểu mẫu và trang đọc là một kết quả của việc thống nhất mô hình dữ liệu trong quá trình cài đặt.

[[SCREENSHOT 4.6|Biểu mẫu nguyên liệu và các bước thực hiện|]]

Hình 4.6 Giao diện nhập nguyên liệu và hướng dẫn chế biến

<!-- page -->
## 4.5 Kết quả xây dựng tương tác và quản trị

Chức năng lưu công thức mở rộng việc khai thác nội dung từ một lần đọc sang việc theo dõi cá nhân. Dữ liệu được gắn với tài khoản để mỗi người có danh sách món quan tâm riêng. Chức năng đánh giá sử dụng điểm số từ 1 đến 5 và cho phép người dùng điều chỉnh điểm đã chọn cho công thức.

[[SCREENSHOT 4.7|Giao diện món đã lưu và đánh giá|]]

Hình 4.7 Giao diện tương tác với công thức

Đối với quản trị viên, các chức năng quản lý danh mục và người dùng phục vụ việc tổ chức dữ liệu chung. Phần này bổ sung vai trò quản lý bên cạnh vai trò đóng góp nội dung của tác giả. Sự khác biệt về quyền được thể hiện trên giao diện và được kiểm tra tại các thao tác ở backend.

[[SCREENSHOT 4.8|Giao diện quản lý danh mục hoặc người dùng|]]

Hình 4.8 Giao diện quản trị

<!-- page -->
## 4.6 Kiểm tra và đánh giá kết quả

Hoạt động kiểm tra được xem xét ở hai mức: khả năng biên dịch của chương trình và tính đúng của những phần xử lý đã có kiểm thử. Theo kết quả đã ghi nhận trong quá trình phát triển, backend biên dịch thành công; 17 trường hợp kiểm thử backend đạt; frontend tạo được bản build và vượt qua kiểm tra mã bằng lint. Những kết quả này cho thấy các phần mã đã được kiểm tra tương ứng có thể được xử lý bởi bộ công cụ của dự án.

Các kiểm thử hiện có tập trung vào một số tình huống tìm kiếm, giới hạn điểm đánh giá, xác minh công thức phục vụ tương tác, xử lý khi bộ nhớ đệm lỗi và kiểm tra thông tin truy cập một thành phần quản lý tác vụ. Phạm vi này giúp xác nhận các quy tắc riêng lẻ nhưng chưa bao quát đầy đủ hành trình sử dụng trên trình duyệt.

Đối với một ứng dụng có giao diện, kết quả build không chứng minh được toàn bộ nghiệp vụ đã hoạt động. Chẳng hạn, quá trình tạo công thức còn phụ thuộc vào trạng thái đăng nhập, kết nối cơ sở dữ liệu và các yêu cầu lưu nội dung. Chức năng ảnh cần thành phần lưu trữ hoạt động; xác nhận email cần phần gửi và nhận thư thử. Vì vậy, việc đánh giá phải đặt các kết quả kiểm tra trong đúng phạm vi.

Ở thời điểm tổng hợp báo cáo, chưa có kết quả xác nhận lại đầy đủ các luồng trên toàn bộ môi trường chạy. Kết quả build và kiểm thử nêu trên được kế thừa từ lần kiểm tra đã ghi nhận trước đó. Phần kiểm tra xuyên suốt còn tồn đọng gồm đăng nhập, tạo công thức, thêm ảnh, xuất bản và tương tác bằng giao diện thực tế.

Các chức năng được trình bày theo chu trình sử dụng: khai thác nội dung công khai, biên soạn bằng tài khoản tác giả, công khai nội dung và sử dụng chức năng cá nhân. Chu trình này cũng là cơ sở để nhóm tổ chức phần trình diễn sản phẩm tại buổi báo cáo, thay vì trình bày các màn hình như những phần không liên quan.

<!-- page -->
## 4.7 Những phần chưa hoàn tất

Phần còn chưa hoàn tất trước hết là việc xác nhận toàn bộ luồng tích hợp trên môi trường chạy. Môi trường Docker chưa sẵn sàng ở lần kiểm tra gần nhất nên chưa thể ghi nhận kết quả chung cho giao diện, API và các thành phần phụ trợ. Bộ ảnh chụp thực tế cũng chưa được bổ sung đầy đủ vào bản báo cáo. Đây là hai nội dung còn tồn đọng trực tiếp đối với phần trình diễn và minh họa sản phẩm.

Một giới hạn khác nằm ở luồng lưu nội dung công thức. Thông tin chung, nguyên liệu, các bước và ảnh có thể được gửi bằng nhiều yêu cầu. Nếu một yêu cầu thất bại giữa chừng, dữ liệu có thể đã được lưu một phần. Tình huống này cần được kiểm tra thêm để bảo đảm người dùng nhận biết rõ kết quả và không hiểu toàn bộ công thức đã được lưu chỉ từ một phản hồi thành công.

Đăng nhập Google đã có phần cài đặt nhưng phụ thuộc vào thông tin cấu hình riêng. Do đó, chức năng này chưa được xem là một phần đã xác nhận hoạt động trong bản chạy mặc định. Phần tài khoản của sản phẩm tập trung vào đăng nhập bằng email và mật khẩu, đồng thời giữ khả năng bổ sung cấu hình đăng nhập Google khi được kiểm tra riêng.

## 4.8 Đánh giá chung

So với mục tiêu đề tài, phần cài đặt đã bao quát được những nhóm chức năng trọng tâm của website chia sẻ công thức. Giá trị của kết quả nằm ở sự liên kết giữa dữ liệu, xử lý và giao diện: công thức được tác giả tạo ra có thể trở thành nội dung để người đọc tìm kiếm, theo dõi và lưu lại.

Tuy nhiên, mức độ hoàn thành cài đặt và mức độ đã được kiểm tra chưa đồng đều. Nhóm đã có cơ sở mã nguồn và một số kết quả kiểm thử, trong khi kiểm tra trên toàn bộ môi trường còn cần hoàn tất. Nhận định này là căn cứ để ưu tiên hoàn thiện phiên bản hiện tại trước khi bổ sung thêm chức năng ngoài phạm vi.

<!-- page -->
# CHƯƠNG 5 KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 5.1 Kết luận

Qua quá trình thực hiện, nhóm đã xây dựng được phần cài đặt của Culinary Blog với các chức năng phục vụ chia sẻ và khai thác công thức nấu ăn. Website có khu vực đọc nội dung công khai, khu vực tác giả biên soạn và quản lý công thức, cùng các chức năng quản trị dữ liệu chung. Tìm kiếm, lưu công thức và đánh giá bổ sung khả năng sử dụng nội dung theo nhu cầu của từng tài khoản.

Về thiết kế, nhóm giữ các nghiệp vụ lõi trong Modular Monolith và tách phần tương tác thành dịch vụ Engagement. Việc kết hợp này giúp thực hành cả tổ chức mã theo mô đun lẫn kết nối dịch vụ. Các điều chỉnh về CQRS, phiên đăng nhập và kiểm tra dữ liệu được thực hiện để những phần cài đặt phối hợp thống nhất hơn.

Kết quả hiện tại đáp ứng phần trọng tâm về cài đặt chức năng, đồng thời còn những nội dung cần xác nhận ở môi trường chạy. Phạm vi kiểm tra và các phần chưa hoàn tất đã được xác định trong Chương 4 để phân biệt với các chức năng đã có mã nguồn.

## 5.2 Hướng phát triển

Hướng hoàn thiện gần nhất là xác nhận các luồng sử dụng chính trên cùng một phiên bản chương trình, bổ sung ảnh minh họa thực tế và xử lý các vấn đề phát sinh khi thao tác liên tiếp. Luồng lưu công thức cần được chú ý ở tình huống lỗi giữa chừng, còn các quyền của tác giả và quản trị viên cần được kiểm tra qua giao diện tương ứng.

Sau khi các phần trên được hoàn thiện, nhóm có thể bổ sung kiểm thử cho những thao tác thường dùng và điều chỉnh giao diện dựa trên kết quả sử dụng. Những chức năng mới như bình luận chỉ được xem xét sau khi các chức năng thuộc phạm vi hiện tại đã được xác nhận đầy đủ. Hướng phát triển này tiếp tục bám vào mục tiêu của đề tài và kết quả học tập đã đạt được.

<!-- page -->
# TÀI LIỆU THAM KHẢO

[1] Nhóm thực hiện. Đặc tả yêu cầu phần mềm Culinary Blog, phiên bản 1.0.0. Tài liệu trong kho mã nguồn, đường dẫn docs/reference/SRS_Culinary_Blog_v1.0.0.md.

[2] Nhóm thực hiện. Mã nguồn Culinary Blog. Kho lưu trữ GitHub.

https://github.com/xuanmanhneee/culinary-blog

[3] Nhóm thực hiện. Tài liệu giới thiệu và phân công công việc của dự án. Tệp README.md trong kho mã nguồn Culinary Blog.

[4] Nhóm thực hiện. Cấu hình môi trường chạy và khởi tạo dữ liệu. Các tệp docker-compose.yml, frontend/.env.example và các phần khởi tạo dữ liệu trong mã nguồn backend.

[5] Nhóm thực hiện. Ghi chú tổ chức và tích hợp kiến trúc. Các tài liệu ARCHITECTURE_MAPPING.md và docs/BACKEND_HANDOFF.md trong kho mã nguồn.

Tài liệu [1] được sử dụng để xác định phạm vi đề tài. Phân tích thiết kế và mô tả kết quả được đối chiếu với mã nguồn [2]; phân công được tổng hợp theo các nhóm công việc trong [3]. Hướng dẫn cài đặt ở phụ lục sử dụng các cấu hình được ghi tại [4].

Phiên bản mã nguồn dùng trong buổi báo cáo: [Điền nhánh hoặc mã commit sau khi chốt phiên bản].

<!-- page -->
# PHỤ LỤC HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY

## A.1 Môi trường cài đặt

Chương trình được chạy theo phương án sử dụng Docker Compose cho backend và các thành phần phụ trợ, trong khi frontend chạy trực tiếp trên máy. Môi trường cần có Git, Docker Desktop dùng Linux containers, Node.js 24 và pnpm 11.12.0. .NET SDK 10 chỉ cần khi chạy hoặc kiểm tra backend trực tiếp ngoài container.

Kho mã nguồn được tải bằng các lệnh sau:

```powershell
git clone https://github.com/xuanmanhneee/culinary-blog.git
cd culinary-blog
```

## A.2 Khởi động backend

Sau khi Docker Desktop sẵn sàng, thực hiện tại thư mục gốc của dự án:

```powershell
docker compose up -d --build
docker compose ps
```

Docker Compose khởi động API chính, Engagement, các cơ sở dữ liệu và những thành phần hỗ trợ lưu ảnh, email thử, bộ nhớ đệm và nhật ký. Cấu trúc cơ sở dữ liệu được cập nhật khi các dịch vụ khởi động. API chính được đưa ra cổng 5000; Engagement được truy cập nội bộ thông qua API chính.

Lần chạy đầu tiên có thể mất thêm thời gian để tải và dựng các image. Nếu API chưa sẵn sàng, nhật ký có thể được xem bằng lệnh docker compose logs api. Frontend chưa nằm trong Docker Compose của dự án và được thực hiện riêng theo mục A.3.

<!-- page -->
## A.3 Cấu hình và chạy frontend

Tại thư mục gốc, chuyển vào frontend, tạo tệp cấu hình và cài các thư viện đã khóa phiên bản:

```powershell
cd frontend
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
```

Trong .env.local, các địa chỉ phục vụ chạy trên máy được đặt như sau. AUTH_SECRET được thay bằng một chuỗi ngẫu nhiên riêng; tệp chứa giá trị này không đưa lên kho mã nguồn.

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
API_URL=http://localhost:5000
API_V1=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=[Chuỗi ngẫu nhiên riêng]
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

Chuỗi ngẫu nhiên có thể tạo bằng lệnh đầu tiên bên dưới. Sau khi điền vào cấu hình, khởi động frontend bằng lệnh pnpm dev.

```powershell
node -p "require('crypto').randomBytes(32).toString('base64')"
pnpm dev
```

## A.4 Khởi tạo dữ liệu mẫu

Mở terminal khác tại thư mục gốc và thực hiện:

```powershell
docker compose exec api dotnet CulinaryBlog.API.dll --seed
```

Dữ liệu mẫu gồm tài khoản, danh mục và công thức. Tài khoản author1@culinaryblog.local có vai trò quản trị; author2@culinaryblog.local có vai trò tác giả. Mật khẩu mẫu là Author@123. Đây là các tài khoản thử đã xác nhận email, chỉ phục vụ môi trường học tập trên máy.

<!-- page -->
## A.5 Truy cập chương trình

Giao diện website được truy cập tại http://localhost:3000. Tài liệu thử API trong môi trường phát triển nằm tại http://localhost:5000/scalar. Địa chỉ http://localhost:5000/health/ready phản ánh khả năng kết nối của API chính với cơ sở dữ liệu.

MailHog được mở tại http://localhost:8025 để xem email thử. Khi sử dụng tài khoản tự đăng ký, email xác nhận được nhận tại đây. Sau khi xác nhận, đăng nhập lại để phiên sử dụng nhận thông tin mới của tài khoản.

## A.6 Kiểm tra sau khi khởi động

Việc kiểm tra bắt đầu bằng danh sách và trang chi tiết công thức. Tiếp theo là đăng nhập bằng tài khoản mẫu, tạo một bản nháp và mở lại để đối chiếu nội dung đã lưu. Khi các bước này hoạt động, có thể tiếp tục kiểm tra ảnh, xuất bản, lưu và đánh giá công thức.

Nếu website không tải dữ liệu, trước hết đối chiếu trạng thái container bằng docker compose ps và kiểm tra địa chỉ API trong .env.local. Nếu đăng nhập ở giao diện gặp lỗi, kiểm tra AUTH_SECRET và khởi động lại frontend sau khi sửa cấu hình. Trường hợp ảnh không hiển thị cần kiểm tra dịch vụ MinIO cùng đường dẫn ảnh tương ứng.

## A.7 Dừng chương trình

Frontend được dừng bằng Ctrl+C tại terminal đang chạy. Các container được dừng tại thư mục gốc bằng lệnh:

```powershell
docker compose down
```

Các volume được giữ lại để sử dụng dữ liệu ở lần chạy sau. Không thêm tùy chọn -v vào lệnh dừng nếu muốn bảo toàn dữ liệu đã nhập trong quá trình sử dụng.
