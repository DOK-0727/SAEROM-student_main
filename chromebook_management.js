function doGet() {
  const userEmail = Session.getActiveUser().getEmail();
  let userName = 'Unknown';

  try {
    const person = People.People.get('people/me', { personFields: 'names' });
    userName = person.names && person.names.length > 0 ? person.names[0].displayName : 'Unknown';
  } catch (e) {
    userName = userEmail ? userEmail.split('@')[0] : 'Unknown';
  }

  const scriptURL = 'https://script.google.com/macros/s/AKfycbzYuHE-3hhJHW31t_FRiEqZrHAodFbcecbzTeO-SFCFV5gkx9nDgjdUu31FgZcq-E052Q/exec';

  const html = `
<html>
<head>
  <style>
    body {
      background-color: #f3f3f3;
      font-family: sans-serif;
    }
    #suggestions {
      text-align: center;
    }
    input[type="checkbox"] {
      width: 22px;
      height: 22px;
      accent-color: #00a6ff;
      vertical-align: middle;
    }
    input[type="text"] {
      width: 140px;
    }
    #reason-box {
      display: none;
      margin-left: 10px;
    }
    #reason-box input {
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 6px;
    }
    .checkbox-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-top: 5px;
      color: #2f2f2f;
    }
  </style>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      const form = document.forms['contact-form'];
      const checkbox = document.getElementById('checkbox');
      const checkboxValue = document.getElementById('checkboxValue');
      const datetimeInput = document.getElementById('datetime');
      const reasonInput = document.getElementById('reason');
      const reasonBox = document.getElementById('reason-box');
      const reasonText = document.getElementById('reason-text');

      const savedState = localStorage.getItem('checkboxChecked');
      if (savedState === 'true') {
        checkbox.checked = true;
        checkboxValue.value = '반출';
      }

      checkbox.addEventListener('change', function () {
        localStorage.setItem('checkboxChecked', checkbox.checked);
        const now = new Date();
        datetimeInput.value = now.toISOString().slice(0, 16);
        checkboxValue.value = checkbox.checked ? '반출' : '반납';

        if (checkbox.checked) {
          reasonBox.style.display = 'inline-block';
          reasonText.value = "";
        } else {
          reasonBox.style.display = 'none';
          reasonInput.value = "";
          submitForm();
        }
      });

      reasonText.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          const reason = reasonText.value.trim();
          if (!reason) {
            reasonText.style.border = '1px solid red';
            return;
          }
          reasonInput.value = reason;
          reasonBox.style.display = 'none';
          submitForm();
        }
      });

      function submitForm() {
        fetch('${scriptURL}', { method: 'POST', body: new FormData(form) })
          .then(response => {
            if (response.ok) {
            } else {
            }
          })
          .catch(error => {
            console.error("Error!", error.message);
          });
      }
    });
  </script>
</head>
<body>
  <div id="suggestions">
    <form method="post" action="${scriptURL}" name="contact-form">
      <input type="checkbox" id="checkbox"/>
      <span id="reason-box">
        <input type="text" id="reason-text" placeholder="반출 사유 (Enter 제출)" />
      </span>
      <span class="checkbox-label">반출/반납</span>
      <input type="hidden" name="여부" id="checkboxValue" value="반납" />
      <input type="datetime-local" name="시간" id="datetime" style="display:none;" />
      <input type="text" name="이름" value="${userName}" style="display:none;" />
      <input type="email" name="메일" value="${userEmail}" style="display:none;" />
      <input type="text" name="사유" id="reason" style="display:none;" />
      <div id="message"></div>
    </form>
  </div>
</body>
</html>
  `;

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}