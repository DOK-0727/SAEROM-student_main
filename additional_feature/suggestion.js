function doGet() {
    const userEmail = Session.getActiveUser().getEmail();

    const html = `
 <html>
   <head>
     <style>
#suggestions {
text-align: center;
width: 200px;
height: auto;
border-radius: 20px;
position: absolute;
background-color: white;
padding:15px;
}

input[type="number"],
textarea {
width: 180px;
padding: 8px;
margin-top: 10px;
margin-bottom: 15px;
border: 1px solid rgba(0,0,0,0.3);
border-radius: 5px;
background-color: #f2f3f3;
font-size: 14px;
}

input[type="submit"] {
width: 100%;
height: 35px;
border: none;
border-radius: 5px;
background-color: #00a6ff;
color: white;
font-weight: bold;
font-size: 15px;
cursor: pointer;
}

h2 {
margin-bottom: 10px;
font-size: 20px;
}

.description {
font-size: 12px;
color: #555;
margin-bottom: 10px;
line-height: 1.4;
}

.example {
font-size: 12px;
color: #555;
margin-top: 10px;
padding-left: 10px;
line-height: 1.6;
border-left: 3px solid #00a6ff;
background-color: #f9f9f9;
padding-top: 8px;
padding-bottom: 8px;
margin-bottom: 15px;
}
     </style>
     <script>
const scriptURL = 'https://script.google.com/macros/s/AKfycby3dvbsvWnLokZ8_nnQ2dNYfoIELXGO9s94DqbiRXObIoM5mUy09JbEIPdB0IL-dkA7Vg/exec';

 document.addEventListener("DOMContentLoaded", function () {
 const form = document.forms['contact-form'];
 const submitBtn = document.getElementById('submit');

 form.addEventListener('submit', e => {
 e.preventDefault();
 submitBtn.style.display = "none";

 fetch(scriptURL, { method: 'POST', body: new FormData(form) })
 .then(response => {
 if (response.ok) {
 alert("제출이 완료되었습니다!");
 form.reset();
 } else {
 alert("제출 실패! 다시 시도해 주세요.");
 }
 submitBtn.style.display = "block";
 })
 .catch(error => {
 alert("제출 중 오류가 발생했습니다.");
 console.error("Error!", error.message);
 submitBtn.style.display = "block";
 });
 });
 });

     </script>

   </head>
   <body>
<div id="suggestions">
<form method="post" action="https://script.google.com/macros/s/AKfycby3dvbsvWnLokZ8_nnQ2dNYfoIELXGO9s94DqbiRXObIoM5mUy09JbEIPdB0IL-dkA7Vg/exec" name="contact-form">
 <h2>크롬북 건의함</h2>
 <div class="description">
 크롬북 사이트의 불편한 점이나<br>
 있었으면 좋겠는 기능을 건의해주세요.
</div>

 <input type="number" name="student" placeholder="학번을 입력하세요" required 
title="학번은 5자리 숫자로 입력하세요" />

 <textarea name="suggestion" placeholder="건의 사항을 입력하세요
(※장난시 벌점 부과※)" rows="5" required></textarea>

 <input type="submit" value="제출하기" id="submit" />

 <input type="email" name="email" value="${userEmail}" style="display:none;"/>

   </body>
 </html>
 `;

    return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}