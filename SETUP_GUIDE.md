# Hướng Dẫn Setup Google Sheets Integration

## Bước 1: Tạo Google Sheet

1. Mở [Google Sheets](https://sheets.google.com)
2. Tạo một sheet mới
3. Đặt tên sheet đầu tiên là "Form Submissions"
4. Thêm các cột header:
   - A1: Timestamp
   - B1: Name  
   - C1: User Type
   - D1: Submission Date

## Bước 2: Tạo Google Apps Script

1. Trong Google Sheet, vào menu **Extensions** > **Apps Script**
2. Xóa code mặc định và paste code từ file `google-apps-script.js`
3. Thay thế `YOUR_SPREADSHEET_ID_HERE` bằng ID của sheet của bạn
   - ID sheet có thể tìm thấy trong URL: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit`
4. Lưu script với tên "Graduation Form Handler"

## Bước 3: Deploy Web App

1. Click **Deploy** > **New deployment**
2. Chọn **Web app**
3. Cấu hình:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy URL được tạo ra

## Bước 4: Cấu hình trong Code

1. Mở file `script.js`
2. Tìm dòng có comment `// this.dataManager.setGoogleSheetsUrl('YOUR_GOOGLE_APPS_SCRIPT_URL_HERE');`
3. Uncomment và thay thế URL bằng URL từ bước 3

```javascript
this.dataManager.setGoogleSheetsUrl('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
```

## Bước 5: Test

1. Mở website của bạn
2. Điền form và submit
3. Kiểm tra Google Sheet xem dữ liệu có được lưu không

## Tính Năng Bổ Sung

### Analytics Integration

Để thêm Google Analytics, thêm script sau vào `<head>` của `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Facebook Pixel

Để thêm Facebook Pixel:

```html
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->
```

## Troubleshooting

### Lỗi CORS
- Đảm bảo Google Apps Script được deploy với quyền "Anyone"
- Kiểm tra URL có đúng không

### Dữ liệu không lưu được
- Kiểm tra console browser để xem lỗi
- Đảm bảo sheet ID đúng
- Kiểm tra quyền truy cập sheet

### Offline Mode
- Dữ liệu sẽ được lưu vào localStorage
- Khi online trở lại, dữ liệu sẽ được sync tự động

## Tính Năng Nâng Cao

### Export Data
Để export dữ liệu từ localStorage:

```javascript
// Trong console browser
window.graduationApp.dataManager.downloadCSV();
```

### View Statistics
Để xem thống kê:

```javascript
// Trong console browser
console.log(window.graduationApp.dataManager.getStatistics());
```

### Manual Sync
Để sync dữ liệu pending:

```javascript
// Trong console browser
window.graduationApp.dataManager.processPendingSubmissions();
```

## Bảo Mật

- Không chia sẻ Google Apps Script URL công khai
- Sử dụng HTTPS cho production
- Xem xét thêm authentication nếu cần

## Performance

- Dữ liệu được cache trong localStorage
- Chỉ gửi dữ liệu cần thiết
- Retry mechanism cho failed requests
- Offline support 