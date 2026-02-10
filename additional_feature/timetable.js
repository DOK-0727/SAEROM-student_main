function doGet(e) {
    // 1. 로그인 사용자 정보 (이메일·학번·이름) 추출
    var email = Session.getActiveUser().getEmail();
    var accS = SpreadsheetApp.getActive().getSheetByName('계정');
    var accData = accS.getDataRange().getValues();
    var hdr = accData[0];
    var idxEmail = hdr.indexOf('Email');
    var idxHakbun = hdr.indexOf('Last Name(학번)');
    var idxName = hdr.indexOf('First Name(이름)');
    var studentHakbun = '';
    var studentName = '';
    for (var i = 1; i < accData.length; i++) {
        if ((accData[i][idxEmail] || '').toString().trim().toLowerCase()
            === (email || '').toString().trim().toLowerCase()) {
            studentHakbun = accData[i][idxHakbun].toString().replace(/^0+/, '');
            studentName = accData[i][idxName] || '';
            break;
        }
    }
    if (!studentHakbun) {
        return HtmlService.createHtmlOutput(
            '<div class="error">계정 정보가 등록되지 않았습니다.<br>(이메일: ' + email + ')</div>'
        );
    }

    // 2. 표준화 함수
    function cleanRoom(room) {
        var m = room ? room.toString().match(/^(\d+)/) : null;
        return m ? m[1] : '';
    }
    function cleanSubject(subj) {
        return subj
            ? subj.toString().split('(')[0].replace(/\s+/g, '').trim()
            : '';
    }

    // 3. 학생편성현황 → 개인 과목 map
    function getMyLectureMap(hakbun) {
        var sh = SpreadsheetApp.getActive().getSheetByName('학생편성현황_dummy');
        var data = sh.getDataRange().getValues();
        var hdr2 = data[1];
        var ciGrade = hdr2.indexOf('계열/학년/학과');
        var ciCls = hdr2.indexOf('반');
        var ciNum = hdr2.indexOf('번호');
        var ciRoom = hdr2.indexOf('개설강의실');
        var ciSubj = hdr2.indexOf('개설과목(학점)');
        var map = {};
        for (var i = 2; i < data.length; i++) {
            var r = data[i];
            var g = (r[ciGrade] || '').toString().replace(/\D/g, '');
            var c = (r[ciCls] || '').toString().replace(/\D/g, '').padStart(2, '0');
            var n = (r[ciNum] || '').toString().replace(/\D/g, '').padStart(2, '0');
            if ((g + c + n) === hakbun) {
                var room = cleanRoom(r[ciRoom]);
                var subj = cleanSubject(r[ciSubj]);
                if (room && subj) map[room + '-' + subj] = true;
            }
        }
        return map;
    }

    // 4. 원적반 전체 시간표
    function getClassTimetable(hakbun) {
        var grade = hakbun.slice(0, 1);
        var cls = hakbun.slice(1, 3);
        var clsNum = parseInt(cls, 10).toString();
        var label = clsNum + '(' + grade + '학년 ' + clsNum + '반)';
        var sh = SpreadsheetApp.getActive().getSheetByName('시간표_dummy');
        var data = sh.getDataRange().getValues();
        var table = Array(5).fill().map(() => Array(7).fill({ subject: '', teacher: '' }));
        for (var i = 1; i < data.length; i++) {
            if (data[i][0] === label) {
                for (var d = 0; d < 5; d++) {
                    for (var p = 0; p < 7; p++) {
                        var idx = 1 + d * 12 + p;
                        var full = data[i][idx];
                        if (full) {
                            var subj = cleanSubject(full);
                            var tm = full.match(/\(([^)]+)\)/);
                            var teacher = tm ? tm[1] : '';
                            table[d][p] = { subject: subj, teacher: teacher };
                        }
                    }
                }
                break;
            }
        }
        return table;
    }

    // 5. 개인 과목 + 원적반 fallback → 최종 시간표
    function getMyTimetableByMap(hakbun) {
        var personal = getMyLectureMap(hakbun);
        var classTbl = getClassTimetable(hakbun);
        var result = Array(5).fill().map(() => Array(7).fill({ subject: '', teacher: '' }));
        var sh = SpreadsheetApp.getActive().getSheetByName('시간표_dummy');
        var data = sh.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
            var room = cleanRoom(data[i][0]);
            for (var d = 0; d < 5; d++) {
                for (var p = 0; p < 7; p++) {
                    var idx = 1 + d * 12 + p;
                    var full = data[i][idx];
                    if (full) {
                        var subj = cleanSubject(full);
                        var tm = full.match(/\(([^)]+)\)/);
                        var teacher = tm ? tm[1] : '';
                        if (personal[room + '-' + subj]) result[d][p] = { subject: subj, teacher: teacher };
                    }
                }
            }
        }
        for (var d = 0; d < 5; d++) {
            for (var p = 0; p < 7; p++) {
                if (!result[d][p].subject) result[d][p] = classTbl[d][p] || { subject: '-', teacher: '' };
            }
        }
        return result;
    }

    // 6. HTML 렌더링 준비
    var tbl = getMyTimetableByMap(studentHakbun);
    var yoils = ['월', '화', '수', '목', '금'];
    var htmlTable = '<table><thead><tr><th>교시</th>'
        + yoils.map(y => '<th>' + y + '</th>').join('')
        + '</tr></thead><tbody>';
    for (var i = 0; i < 7; i++) {
        if (i === 4) htmlTable += '<tr class="lunch-row"><td>점심시간</td><td colspan="5">🍱 점심시간 🍱</td></tr>';
        htmlTable += '<tr><td>' + (i + 1) + '교시</td>';
        for (var j = 0; j < 5; j++) {
            var c = tbl[j][i] || { subject: '-', teacher: '' };
            var sbj = c.subject || '-';
            var trc = c.teacher ? '<br><span class="teacher-text">(' + c.teacher + ')</span>' : '';
            htmlTable += '<td><span class="subject-text">' + sbj + '</span>' + trc + '</td>';
        }
        htmlTable += '</tr>';
    }
    htmlTable += '</tbody></table>';
    var fullHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>MY 시간표</title>
<style>
  :root {
    --bg-color: linear-gradient(to right,#eef2f3,#8e9eab);
    --header-bg:#4a69bd;
    --text-color:#333;
    --lunch-color:#ffeaa7;
    --hover-color:#dff9fb;
    --button-bg:#4a69bd;
    --button-color:#fff;
    --button-hover:#2e59a3;
    --h1-color:#2f415b;
    --left-bg:#f3f5fa;
    --left-color:#30323a;
  }
  html,body{font-size:18px;margin:0;padding:36px 0;font-family:'Segoe UI',sans-serif;
    background:#f5f6fa;display:flex;flex-direction:column;align-items:center;}
  .timetable-container{background:var(--bg-color);border-radius:15px;
    box-shadow:0 8px 20px rgba(0,0,0,0.08);padding:18px 6px 13px;max-width:540px;width:95vw;position:relative;}
  .theme-top-wrap{position:absolute;top:10px;left:10px;}
  .theme-btn{padding:7px 13px;font-size:.83em;border:none;border-radius:7px;
    background:var(--button-bg);color:var(--button-color);cursor:pointer;
    box-shadow:0 1px 3px rgba(60,80,140,0.07);transition:.22s;font-weight:500;}
  .theme-btn:hover{background:var(--button-hover);}
  .theme-picker-popup{position:fixed;top:90px;left:50%;transform:translateX(-50%);
    background:#fff;border-radius:18px;box-shadow:0 5px 28px rgba(40,45,80,0.13);
    padding:22px 28px;z-index:99999;display:flex;flex-direction:column;align-items:center;
    animation:popAppear .28s;}
  @keyframes popAppear{0%{opacity:0;transform:translateX(-50%) scale(.8);}100%{opacity:1;transform:translateX(-50%) scale(1);}}
  .theme-picker-row{display:flex;gap:13px;flex-wrap:wrap;justify-content:center;margin:8px 0;}
  .theme-picker-popup .close-btn{position:absolute;top:9px;right:18px;background:none;
    border:none;font-size:22px;color:#666;cursor:pointer;transition:.14s;}
  .theme-picker-popup .close-btn:hover{color:#e74c3c;}
  .theme-circle{width:28px;height:28px;border-radius:50%;border:2px solid transparent;
    box-shadow:0 1px 4px rgba(0,0,0,0.08);cursor:pointer;display:flex;align-items:center;
    justify-content:center;transition:.15s;}
  .theme-circle.selected{border:2px solid #222;box-shadow:0 2px 8px rgba(0,0,0,0.13);}
  .theme-name-label{font-size:12px;color:#555;text-align:center;}
  h1{text-align:center;margin-bottom:7px;color:var(--h1-color);font-size:1.04em;font-weight:bold;}
  .student-info{text-align:center;margin-bottom:8px;font-weight:bold;font-size:.91em;color:var(--text-color);}
  table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border-radius:10px;
    overflow:hidden;box-shadow:0 3px 10px rgba(60,80,140,0.09);}
  th,td{padding:5px 2.5px;text-align:center;border:none;font-size:.79em;position:relative;}
  th{background:var(--header-bg);color:#fff;font-size:.93em;}
  th:first-child{border-top-left-radius:10px;}th:last-child{border-top-right-radius:10px;}
  td:first-child{font-weight:bold;background:var(--left-bg) !important;color:var(--left-color);
    border-left:2px solid #e0e4ed;font-size:.85em;}
  tr:last-child td:first-child{border-bottom-left-radius:10px;}tr:last-child td:last-child{border-bottom-right-radius:10px;}
  tr.lunch-row td{background:var(--lunch-color) !important;font-weight:bold;font-size:.97em;
    border-top:1.2px solid #f2e4a6;border-bottom:1.2px solid #f2e4a6;}
  td.now-active{background:linear-gradient(90deg,#ffe08c77,#ffe08c33,#fff8e377);
    box-shadow:0 0 0 2px #ffd60066;font-weight:bold;animation:popnow 1.2s cubic-bezier(.7,.2,.3,1) 1;}
  @keyframes popnow{0%{transform:scale(1.04);}60%{transform:scale(1.045);}80%{transform:scale(1.01);}100%{transform:scale(1);}}
  td:hover{background:var(--hover-color);}td{border-right:1px solid #e4e8f0;border-bottom:1px solid #e4e8f0;}
  td:last-child{border-right:none;}tr:last-child td{border-bottom:none;}
  .subject-text{font-weight:500;}.teacher-text{font-size:.74em;color:#888;}
  .error{color:#e74c3c;font-weight:bold;text-align:center;padding:12px;}
  #result{min-height:45px;display:flex;align-items:center;justify-content:center;}
</style>
</head>
<body>
<div class="timetable-container">
  <div class="theme-top-wrap">
    <button class="theme-btn" onclick="openThemePopup()">🎨 테마 바꾸기</button>
  </div>
  <div id="theme-popup-root"></div>
  <h1>MY 시간표</h1>
  <div class="student-info">${studentHakbun} (${studentName})</div>
  <div id="result">${htmlTable}</div>
</div>

<script>
  const themes = [
    { name: "클래식",       left:"#f3f5fa #30323a", bg:"linear-gradient(to right,#eef2f3,#8e9eab)", header:"#4a69bd", text:"#333",    lunch:"#ffeaa7", hover:"#dff9fb", buttonBg:"#4a69bd", buttonColor:"#fff", buttonHover:"#2e59a3", h1Color:"#2f415b" },
    { name: "핑크캔디",     left:"#fde7f5 #b3355e", bg:"linear-gradient(to right,#ffd6e7,#fff0f5)", header:"#f78fb3", text:"#5c2a50", lunch:"#ffdaec", hover:"#f3d9ec", buttonBg:"#f78fb3", buttonColor:"#fff", buttonHover:"#fd6bcb", h1Color:"#e64c91" },
    { name: "민트그린",     left:"#d4f4ea #036159", bg:"linear-gradient(to right,#c8e6c9,#e0f2f1)", header:"#009688", text:"#004d40", lunch:"#b2dfdb", hover:"#c8f7f0", buttonBg:"#009688", buttonColor:"#fff", buttonHover:"#00695c", h1Color:"#009688" },
    { name: "딥다크",       left:"#323a47 #fff",    bg:"linear-gradient(to right,#2f3542,#57606f)", header:"#1e272e", text:"#fff",    lunch:"#898989", hover:"#DBDBDB", buttonBg:"#1e272e", buttonColor:"#fff", buttonHover:"#2f3542", h1Color:"#fff" },
    { name: "레드프레시",   left:"#ffe1bb #c03000", bg:"linear-gradient(120deg,#a80000 0%,#fa5858 50%,#ffd6d6 100%)", header:"#d7263d", text:"#fff",    lunch:"#ffe5e0", hover:"#ffd5d5", buttonBg:"#d7263d", buttonColor:"#fff", buttonHover:"#ad1032", h1Color:"#ffe05b" },
    { name: "오렌지버스트", left:"#ffe3c0 #b56000", bg:"linear-gradient(100deg,#fcb045 0%,#fd6e50 100%)", header:"#fd6e50", text:"#432800", lunch:"#ffe4b5", hover:"#ffe5cf", buttonBg:"#fd6e50", buttonColor:"#fff", buttonHover:"#d44824", h1Color:"#ff6b00" },
    { name: "옐로우팝",     left:"#fff3c1 #a68501", bg:"linear-gradient(120deg,#ffc300 0%,#fff200 50%,#fffbe5 100%)", header:"#ffe200", text:"#4a4300", lunch:"#fff9c4", hover:"#fff7a8", buttonBg:"#ffe200", buttonColor:"#4a4300", buttonHover:"#ffcc00", h1Color:"#ffbf01" },
    { name: "퍼플드림",     left:"#ece2fc #7639b8", bg:"linear-gradient(100deg,#c471f5 0%,#fa71cd 100%)", header:"#8e54e9", text:"#fff",    lunch:"#f3d0fb", hover:"#f8e1ff", buttonBg:"#8e54e9", buttonColor:"#fff", buttonHover:"#7b34c6", h1Color:"#8e54e9" },
    // ── 추가 테마 ──
    { name: "라벤더 필드", left:"#d4fc79 #7dd56f", bg:"linear-gradient(to right,#d4fc79,#96e6a1)", header:"#7dd56f", text:"#3c4a3d", lunch:"#b8e8a5", hover:"#d0f1bf", buttonBg:"#7dd56f", buttonColor:"#fff", buttonHover:"#67b85a", h1Color:"#fff" },
    { name: "민트 리프",   left:"#a8edea #00a3ff", bg:"linear-gradient(to right,#a8edea,#fed6e3)", header:"#6dd5ed", text:"#2f4858", lunch:"#d1f4f9", hover:"#dff8fb", buttonBg:"#6dd5ed", buttonColor:"#fff", buttonHover:"#56b1d6", h1Color:"#fff" },{
  name: "베이지",
  left: "#f5f1e9 #6b5e43",
  bg:    "linear-gradient(to right,#f9f4eb,#e5dec9)",
  header:"#a1866f",
  text:  "#4a3f2a",
  lunch: "#f3e9d2",
  hover: "#f0e6ca",
  buttonBg:    "#a1866f",
  buttonColor: "#fff",
  buttonHover: "#8b795b",
  h1Color:     "#6b5e43"
}
  ];
  var currentTheme = 0;

  function openThemePopup() {
    if (document.getElementById('theme-picker-popup')) return;
    const popupRoot = document.getElementById('theme-popup-root');
    const popup = document.createElement('div');
    popup.className = 'theme-picker-popup';
    popup.id = 'theme-picker-popup';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '✖️';
    closeBtn.onclick = e => { e.stopPropagation(); closeThemePopup(); };
    popup.appendChild(closeBtn);

    const row = document.createElement('div');
    row.className = 'theme-picker-row';
    const nameLabel = document.createElement('div');
    nameLabel.className = 'theme-name-label';
    nameLabel.innerText = themes[currentTheme].name;

    themes.forEach((th, idx) => {
      const cir = document.createElement('div');
      cir.className = 'theme-circle' + (idx===currentTheme? ' selected':'');
      cir.style.background = th.bg;
      cir.title = th.name;
      cir.onclick = ev => {
        ev.stopPropagation();
        applyTheme(idx);
        document.querySelectorAll('.theme-circle').forEach((el,i)=> el.classList.toggle('selected', i===idx));
        nameLabel.innerText = th.name;
      };
      row.appendChild(cir);
    });

    popup.appendChild(row);
    popup.appendChild(nameLabel);
    popupRoot.appendChild(popup);
    popup.addEventListener('mousedown', e => e.stopPropagation());

    setTimeout(() => document.addEventListener('mousedown', clickOut), 20);
    function clickOut(e) {
      if (popup && !popup.contains(e.target)) closeThemePopup();
    }
    window._themeClickOut = clickOut;
  }

  function closeThemePopup() {
    const p = document.getElementById('theme-picker-popup');
    if (p) p.remove();
    if (window._themeClickOut) document.removeEventListener('mousedown', window._themeClickOut);
  }

  function applyTheme(i) {
    currentTheme = i;
    try { localStorage.setItem('student_timetable_theme_idx', i) } catch(e){}
    const rt = document.documentElement;
    const th = themes[i];
    rt.style.setProperty('--bg-color', th.bg);
    rt.style.setProperty('--header-bg', th.header);
    rt.style.setProperty('--text-color', th.text);
    rt.style.setProperty('--lunch-color', th.lunch);
    rt.style.setProperty('--hover-color', th.hover);
    rt.style.setProperty('--button-bg', th.buttonBg);
    rt.style.setProperty('--button-color', th.buttonColor);
    rt.style.setProperty('--button-hover', th.buttonHover);
    rt.style.setProperty('--h1-color', th.h1Color || th.text);
    const sp = th.left.split(' ');
    rt.style.setProperty('--left-bg', sp[0]);
    rt.style.setProperty('--left-color', sp[1]);
  }

  const periods = [
    { name:'1교시', start:'08:00', end:'09:28' },
    { name:'2교시', start:'09:28', end:'10:28' },
    { name:'3교시', start:'10:28', end:'11:28' },
    { name:'4교시', start:'11:28', end:'12:28' },
    { name:'점심시간', start:'12:28', end:'13:28' },
    { name:'5교시', start:'13:28', end:'14:28' },
    { name:'6교시', start:'14:28', end:'15:28' },
    { name:'7교시', start:'15:28', end:'16:28' }
  ];

  function isNowInPeriod(p, n) {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const s = new Date(n.getFullYear(), n.getMonth(), n.getDate(), sh, sm);
    const e = new Date(n.getFullYear(), n.getMonth(), n.getDate(), eh, em);
    return n >= s && n < e;
  }

  function highlightCurrentPeriod() {
    const now = new Date();
    const wd = now.getDay();
    if (wd < 1 || wd > 5) return;
    const col = wd - 1;
    let idxRow = 0;
    document.querySelectorAll('tbody tr').forEach(tr => {
      if (tr.classList.contains('lunch-row')) {
        tr.querySelectorAll('td').forEach((td, i) => {
          td.classList.toggle('now-active', i === col+1 && isNowInPeriod(periods[4], now));
        });
      } else {
        const pi = idxRow < 4 ? idxRow : idxRow + 1;
        tr.querySelectorAll('td').forEach((td, i) => {
          td.classList.toggle('now-active', i === col+1 && isNowInPeriod(periods[pi], now));
        });
        idxRow++;
      }
    });
  }

  window.onload = function() {
    let st = 0;
    try { st = parseInt(localStorage.getItem('student_timetable_theme_idx')||'0'); } catch(e){}
    if (isNaN(st) || st<0 || st>=themes.length) st = 0;
    applyTheme(st);
    highlightCurrentPeriod();
    setInterval(highlightCurrentPeriod, 60000);
  };
</script>
</body>
</html>
`;

    return HtmlService
        .createHtmlOutput(fullHtml)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}