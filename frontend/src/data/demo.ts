import type { Thread, LawDocument, Template, TemplateType } from '../types';

export const demoThreads: Thread[] =[
 {id:'demo-wage',title:'Mức lương trong thời gian thử việc',preview:'Lương thử việc tối thiểu được xác định như thế nào?',date:'27/10/2026',messages:[{role:'user',text:'Lương công việc của tôi là 12 triệu đồng/tháng. Công ty trả lương thử việc 9 triệu đồng thì có phù hợp không?'},{role:'assistant',kind:'wage'}]},
 {id:'demo-notice',title:'Thời hạn báo trước khi nghỉ việc',preview:'Tìm hiểu các điều kiện trước khi chấm dứt hợp đồng.',date:'26/10/2026',messages:[{role:'user',text:'Tôi muốn nghỉ việc thì cần cung cấp những thông tin gì để xác định thời gian báo trước?'},{role:'assistant',kind:'notice'}]},
 {id:'demo-probation',title:'Kết thúc thời gian thử việc',preview:'Đối chiếu thời gian thử việc và nội dung hợp đồng.',date:'25/10/2026',messages:[{role:'user',text:'Tôi đang thử việc và muốn tìm quy định liên quan.'},{role:'assistant',kind:'generic'}]}
];

export const demoDocs: LawDocument[] =[
 {id:'law45',title:'Bộ luật Lao động',number:'45/2019/QH14',type:'PDF scan',status:'Đã duyệt',date:'25/10/2026',size:'5,0 MB',note:'Bản gốc năm 2019 · cần đối chiếu sửa đổi'},
 {id:'law18',title:'Bộ luật Lao động — bản hợp nhất',number:'18/VBHN-VPQH',type:'DOCX',status:'Chờ kiểm tra',date:'26/10/2026',size:'Tài liệu mẫu',note:'Thông tin phiên bản đang được kiểm tra'},
 {id:'law145',title:'Điều kiện lao động và quan hệ lao động',number:'145/2020/NĐ-CP',type:'PDF',status:'Chờ kiểm tra',date:'26/10/2026',size:'Tài liệu mẫu',note:'Cần kiểm tra hiệu lực từng nội dung'}
];

export const templates: Record<TemplateType, Template> ={resignation:{title:'Đơn nghỉ việc',fullTitle:'ĐƠN ĐỀ NGHỊ NGHỈ VIỆC',tag:'Chấm dứt hợp đồng',desc:'Trình bày nguyện vọng, thời gian dự kiến và nội dung bàn giao.',type:'briefcase',reason:'Vì định hướng phát triển cá nhân, tôi mong muốn được trao đổi và thống nhất về việc nghỉ việc.',note:'Mẫu minh họa đề nghị thỏa thuận nghỉ việc. Hãy kiểm tra nội dung và thời hạn theo trường hợp thực tế.'},leave:{title:'Đơn xin nghỉ phép',fullTitle:'ĐƠN XIN NGHỈ PHÉP',tag:'Thời giờ nghỉ ngơi',desc:'Chuẩn bị lịch nghỉ, lý do và phương án bàn giao công việc.',type:'calendar',reason:'Tôi cần sắp xếp công việc cá nhân và mong được xem xét lịch nghỉ nêu trên.',note:'Mẫu tham khảo. Thời gian nghỉ và việc bàn giao cần phù hợp với tình huống thực tế.'},application:{title:'Đơn xin việc',fullTitle:'ĐƠN XIN VIỆC',tag:'Bắt đầu công việc',desc:'Giới thiệu bản thân và nguyện vọng ứng tuyển một cách chỉn chu.',type:'user',reason:'Tôi mong muốn ứng tuyển vị trí phù hợp với kinh nghiệm và định hướng nghề nghiệp của mình.',note:'Mẫu tham khảo. Chỉ sử dụng thông tin và kinh nghiệm đúng với hồ sơ của bạn.'}};

