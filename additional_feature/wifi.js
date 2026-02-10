function doGet() {
    const userEmail = Session.getActiveUser().getEmail();

    const html = `
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>와이파이 연결법</title>
  <style>
    body {
      text-align: center;
      padding: 30px;
      background-color:#ffffff;
    }

    h1 {
      font-size: 28px;
    }

    .info {
      font-size: 20px;
      margin: 10px;
    }

    .high-light {
      font-size: 18px;
      background-color: #FFFF00;
      padding: 10px;
      border-radius: 10px;
      display: inline-block;
      margin: 10px;
      font-weight: bold;
    }

    .setting-section {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .form-box {
      border-radius: 8px;
      text-align: left;
      width: 300px;
    }

    .form-box label {
      display: block;
      margin-top: 10px;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .form-box select {
      width: 100%;
      padding: 8px;
      font-size: 16px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .form-box input {
      width: 280px;
      padding: 8px;
      margin-bottom: 15px;
      font-size: 16px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <div class="setting-section">
    <div class="form-box">
      <label><strong>EAP 방식</strong></label>
      <select disabled><option>PEAP</option></select>

      <label><strong>EAP 2단계 인증</strong></label>
      <select disabled><option>자동</option></select>

      <label><strong>서버 CA 인증서</strong></label>
      <select disabled><option>확인 안함</option></select>

      <label>주제 일치</label>
      <select disabled><option></option></select>

      <label>제목 보조 이름 일치</label>
      <select disabled><option></option></select>

      <label>도메인 서비스 일치</label>
      <select disabled><option></option></select>

      <label>주소</label>
      <input type="text" value="saeromhs">

      <label><strong>비밀번호</strong></label>
      <input type="text" value="srLearn2019!">

      <label>익명 ID</label>
      <input type="text">
    </div>
  </div>
</body>
</html>
 `;

    return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}