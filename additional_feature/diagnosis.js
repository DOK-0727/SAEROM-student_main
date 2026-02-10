function doGet() {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>간단 질병 진단기</title>
  <style>
    #diagnosis-form {
      text-align: center;
      padding: 20px;
      width: 200px;
      border-radius: 20px;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
    }
    input[type="text"] {
      width: 160px;
      padding: 8px;
      margin-top: 10px;
      margin-bottom: 15px;
      border: 1px solid rgba(0,0,0,0.3);
      border-radius: 5px;
      background-color: #f2f3f3;
      font-size: 14px;
    }
    input[type="submit"] {
      width: 180px;
      height: 35px;
      border: none;
      border-radius: 5px;
      background-color: #00a6ff;
      color: white;
      font-weight: bold;
      font-size: 15px;
      cursor: pointer;
    }
    #result {
      margin-top: 20px;
      font-size: 14px;
      color: #444;
      text-align: left;
    }
  </style>
</head>
<body>
  <div id="diagnosis-form">
    <form id="contact-form">
      <h2>간단 질병 진단기</h2>
      <h6>※이 결과는 참고용입니다. 정확한 진단은 병원에서 전문의와 상담하시기 바랍니다.※</h6>
      <input type="text" name="symptom1" placeholder="증상을 입력하세요." required />
      <input type="submit" value="진단" />
      <div id="result"></div>
    </form>
  </div>

  <script>
    const API_KEY = ""; // 여기 본인의 OpenAI 키 입력

    document.addEventListener("DOMContentLoaded", function () {
      const form = document.getElementById("contact-form");
      const resultDiv = document.getElementById("result");

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        resultDiv.innerText = "분석 중...";

        const symptom1 = form.symptom1.value.trim();

        const prompt = \`증상: \${symptom1}\\n\\n이 증상을 바탕으로 예상되는 질병 이름을 한 줄로 출력하고, 그에 대한 적절한 조치를 한 줄로 알려줘. 다음 형식을 지켜줘:\\n\\n질병 이름: (내용)\\n조치: (내용)\`;

        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": \`Bearer \${API_KEY}\`
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: "너는 의학 정보를 간단히 설명해주는 진단 어시스턴트야." },
                { role: "user", content: prompt }
              ],
              temperature: 0.7
            })
          });

          const data = await response.json();
          const output = data.choices[0].message.content;

          const diseaseMatch = output.match(/질병\\s*이름\\s*:\\s*(.*)/);
          const adviceMatch = output.match(/조치\\s*:\\s*(.*)/);

          const disease = diseaseMatch ? diseaseMatch[1] : "알 수 없음";
          const advice = adviceMatch ? adviceMatch[1] : "적절한 조치를 제공할 수 없습니다.";

          resultDiv.innerHTML = \`
            <strong>예상 질병 이름:</strong><br>\${disease}<br><br>
            <strong>권장 조치:</strong><br>\${advice}
          \`;
        } catch (error) {
          console.error("API 오류:", error);
          resultDiv.innerText = "오류 발생: GPT API 호출 실패";
        }
      });
    });
  </script>
</body>
</html>`;

    return HtmlService.createHtmlOutput(html)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME); // ← Google Sites iframe 호환
}
