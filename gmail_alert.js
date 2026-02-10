function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function doGet() {
    const userEmail = Session.getActiveUser().getEmail();
    const threads = GmailApp.getInboxThreads(0, 20);
    const unreadCount = threads.filter(thread => thread.isUnread()).length;

    let latestSubject = "최근 메일이 없습니다";
    if (threads.length > 0) {
        const messages = threads[0].getMessages();
        latestSubject = messages[messages.length - 1].getSubject();
    }

    const escapedSubject = escapeHtml(latestSubject);
    const escapedEmail = escapeHtml(userEmail);
    const photoUrl = "https://www.google.com/s2/photos/profile/" + encodeURIComponent(userEmail);
    const courseWorkList = getClassroomCoursework();
    courseWorkList.sort((a, b) => {
        if (!a.dueDateObj && !b.dueDateObj) {
            return new Date(b.creationTime) - new Date(a.creationTime);
        } else if (!a.dueDateObj) {
            return 1;
        } else if (!b.dueDateObj) {
            return -1;
        } else {
            return new Date(a.dueDateObj) - new Date(b.dueDateObj);
        }
    });

    const htmlList = courseWorkList.map((item, index) => {
        let displayTime = "없음";
        let hideButtonHTML = "";
        let isNoDue = item.dueDateStr === "마감일 없음";
        // 🔧 고유 taskId 생성
        let baseId = `${item.title}-${item.courseName}-${item.alternateLink}`;
        let sanitizedId = baseId.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '');
        let taskId = `task-${sanitizedId}`;
        let titleEscaped = escapeHtml(item.title);

        if (!isNoDue) {
            const fullDueStr = addNineHoursToDateTime(item.dueDateStr);
            const dueTime = fullDueStr.slice(11);
            displayTime = (dueTime === "23:59") ? fullDueStr.slice(0, 10) : fullDueStr;
        } else {
            hideButtonHTML = `<button class="hide_button" type="button" data-id="${taskId}" data-title="${titleEscaped}">숨김</button>`;
        }

        return `
   <li id="${taskId}" class="${isNoDue ? "no-due" : ""}" data-id="${taskId}">
     <strong>${item.title}</strong><br>
     과목: ${item.courseName}<br>
     ${!isNoDue ? `마감일: ${displayTime}<br>` : ""}
     <div class="action-row">
       <a href="${item.alternateLink}" target="_blank">과제 보기</a>
       ${hideButtonHTML}
     </div>
   </li>
 `;
    });

    const html = `
<html>
<head>
 <style>
   body {
     font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
     background-color: #f3f3f3;
   }
   .container {
     display: flex;
   }
   .card {
     width: 220px;
     background-color: white;
     border-radius: 20px;
     box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
     padding: 20px;
     flex-wrap: wrap;
     justify-content: center;
     margin-top:20px;
   }
   .title {
     font-size: 20px;
     font-weight: 600;
     margin-bottom: 10px;
   }
   .subtitle {
     font-size: 14px;
     color: #8e8e93;
     margin-bottom: 8px;
   }
   .badge {
     background-color: #ff3b30;
     color: white;
     padding: 6px 12px;
     border-radius: 20px;
     font-size: 16px;
     font-weight: 500;
     margin-bottom: 12px;
     width:30px;
   }
   .subject {
     font-size: 14px;
     overflow: hidden;
     white-space: nowrap;
     text-overflow: ellipsis;
     font-weight: 500;
   }
   .profile {
     display: flex;
     align-items: center;
     margin-bottom: 16px;
   }
   .profile img {
     border-radius: 50%;
     margin-right: 10px;
   }
   .email {
     font-size: 13px;
     color: #636366;
   }
   ul {
     display: flex;
     flex-wrap: wrap;
     justify-content: center;
     list-style-type: none;
     padding:0px;
     position:relative;
     top:-30px;
     gap:5px
   }
   li {
     background: white;
     padding: 20px;
     border-radius: 20px;
     border: 2px solid #f3f3f3;
     width: 180px;
     display: flex;
     flex-direction: column;
     justify-content: center;
   }
   .action-row {
     display: flex;
     justify-content: space-between;
     align-items: center;
     margin-top: 6px;
   }
   #hidden-tasks {
     padding: 10px;
     display: none;
     margin-bottom:-60px;
   }
   .hidden-task-title {
     display: -webkit-box;
     -webkit-line-clamp: 1;
     -webkit-box-orient: vertical;
     overflow: hidden;
     word-break: break-all;      /* 긴 단어도 줄바꿈 허용 */
     text-overflow: ellipsis;
     max-width: 140px;
     line-height: 1.4;
   }
   #pagination {
     margin-top: 15px;
     text-align: center;
     position:relative;
     top:-30px;
   }
   #pagination button {
     margin: 0 5px;
     padding: 5px 10px;
     border: none;
     background-color: #ccc;
     color: white;
     border-radius: 4px;
   }
   #pagination button:disabled {
     margin: 0 5px;
     padding: 5px 10px;
     border: none;
     background-color: #00a6ff;
     color: white;
     border-radius: 4px;
   }
   .center-controls {
     text-align: center;
     margin-top: 20px;
   }
   .hide_button {
     width:60px;
     height: 35px;
     border: none;
     border-radius: 5px;
     background-color: #00a6ff;
     color: white;
     font-weight: bold;
     font-size: 15px;
     cursor: pointer;
   }
   .hide_list_button {
     width:130px;
     height: 35px;
     border: none;
     border-radius: 5px;
     background-color: #00a6ff;
     color: white;
     font-weight: bold;
     font-size: 15px;
     cursor: pointer;
     position:relative;
     top:-30px;
   }
   .show_button {
     width:180px;
     height: 35px;
     border: none;
     border-radius: 5px;
     background-color: #00a6ff;
     color: white;
     font-weight: bold;
     font-size: 15px;
     cursor: pointer;
     margin-top: 10px;
   }
   li strong {
     display: block;
     width: 180px;
     overflow: hidden;
     text-overflow: ellipsis;
     white-space: nowrap;
     font-size: 16px;
     font-weight: 600;
   }
   }

 </style>
 <script>
   const allTasks = ${JSON.stringify(htmlList)};
   let currentPage = 1;
   const tasksPerPage = 3;
   let searchKeyword = "";

   function getVisibleTasks() {
     const hidden = JSON.parse(localStorage.getItem("hiddenTasks") || "[]");
     const hiddenIds = hidden.map(item => item.id);
     return allTasks.filter(taskHtml => {
       const match = taskHtml.match(/id="(task-[a-zA-Z0-9-_]+)"/);
       if (!match) return true;
       const taskId = match[1];
       const isHidden = hiddenIds.includes(taskId);
       const matchesSearch = taskHtml.toLowerCase().includes(searchKeyword.toLowerCase());
       return !isHidden && matchesSearch;
     });
   }

   function onSearchChange() {
     const input = document.getElementById("search-input");
     searchKeyword = input.value.trim();
     renderTasks();
   }

   function renderTasks() {
     const listEl = document.getElementById("task-list");
     listEl.innerHTML = "";
     const visibleTasks = getVisibleTasks();
     const totalPages = Math.ceil(visibleTasks.length / tasksPerPage);
     // 현재 페이지가 존재하지 않으면 이전 페이지로
     if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
     const start = (currentPage - 1) * tasksPerPage;
     const end = start + tasksPerPage;
     const pageTasks = visibleTasks.slice(start, end);
     pageTasks.forEach(html => {
       const temp = document.createElement("div");
       temp.innerHTML = html;
       const li = temp.firstElementChild;
       listEl.appendChild(li);
     });
     const hideButtons = listEl.querySelectorAll(".hide_button");
     hideButtons.forEach(button => {
       button.addEventListener("click", () => {
         const id = button.getAttribute("data-id");
         const title = button.getAttribute("data-title");
         hideTask(id, title);
       });
     });
     updatePagination(visibleTasks.length);
   }

   function updatePagination(taskCount) {
     const totalPages = Math.ceil(taskCount / tasksPerPage);
     const pagination = document.getElementById("pagination");
     pagination.innerHTML = "";
     for (let i = 1; i <= totalPages; i++) {
       const btn = document.createElement("button");
       btn.textContent = i;
       btn.disabled = i === currentPage;
       btn.onclick = () => {
         currentPage = i;
         renderTasks();
       };
       pagination.appendChild(btn);
     }
   }

   function pruneOldHiddenTasks() {
     const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
     let hidden = JSON.parse(localStorage.getItem("hiddenTasks") || "[]");
     const now = Date.now();
     hidden = hidden.map(item => {
       const expired = item.deletedAt && (now - item.deletedAt >= THREE_DAYS);
       return { ...item, expired };
     });
     localStorage.setItem("hiddenTasks", JSON.stringify(hidden));
   }

   function hideTask(id, title) {
     pruneOldHiddenTasks(); // 오래된 것 먼저 제거
     let hidden = JSON.parse(localStorage.getItem("hiddenTasks") || "[]");
     if (!hidden.some(item => item.id === id)) {
       hidden.push({ id, title, deletedAt: Date.now() });
       localStorage.setItem("hiddenTasks", JSON.stringify(hidden));
     }
     renderTasks();
     updateHiddenList();
     google.script.run.addHiddenTaskId(id);
   }

   // 렌더링 전에 오래된 항목 제거
   function renderTasks() {
     pruneOldHiddenTasks();  // 호출
     const listEl = document.getElementById("task-list");
     listEl.innerHTML = "";
     const visibleTasks = getVisibleTasks();
     const totalPages = Math.ceil(visibleTasks.length / tasksPerPage);
     if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
     const start = (currentPage - 1) * tasksPerPage;
     const end = start + tasksPerPage;
     const pageTasks = visibleTasks.slice(start, end);
     pageTasks.forEach(html => {
       const temp = document.createElement("div");
       temp.innerHTML = html;
       const li = temp.firstElementChild;
       listEl.appendChild(li);
     });

     const hideButtons = listEl.querySelectorAll(".hide_button");
     hideButtons.forEach(button => {
       button.addEventListener("click", () => {
         const id = button.getAttribute("data-id");
         const title = button.getAttribute("data-title");
         hideTask(id, title);
       });
     });
     updatePagination(visibleTasks.length);
   }

   function showTask(id) {
     let hidden = JSON.parse(localStorage.getItem("hiddenTasks") || "[]");
     hidden = hidden.filter(item => item.id !== id);
     localStorage.setItem("hiddenTasks", JSON.stringify(hidden));
     renderTasks();
     updateHiddenList();
   }

   function updateHiddenList() {
     const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
     const now = Date.now();
     let hidden = JSON.parse(localStorage.getItem("hiddenTasks") || "[]");
     hidden = hidden.filter(item => {
       return item.deletedAt && (now - item.deletedAt < THREE_DAYS);
     });

     localStorage.setItem("hiddenTasks", JSON.stringify(hidden));
     const list = document.getElementById("hidden-tasks-list");
     if (!list) return;
     list.innerHTML = "";
     if (hidden.length === 0) {
       list.innerHTML = "<li>숨긴 과제는 3일 후 삭제됩니다.</li>";
       return;
     }
     hidden.forEach(item => {
       const li = document.createElement("li");
       const strong = document.createElement("strong");
       strong.textContent = item.title;
       const showButton = document.createElement("button");
       showButton.textContent = "표시";
       showButton.className = "show_button";
       showButton.onclick = () => showTask(item.id);
       li.appendChild(strong);
       li.appendChild(showButton);
       list.appendChild(li);
     });
   }

   function toggleHiddenTasks() {
     const section = document.getElementById("hidden-tasks");
     section.style.display = section.style.display === "none" ? "block" : "none";
     if (section.style.display === "block") updateHiddenList();
   }
   window.onload = function () {
     renderTasks(); // 숨김가 반영된 상태로 정확히 렌더링
   };
 </script>

</head>
<body>
 <div class="container">
   <div class="card">
     <div class="profile">
       <img src="${photoUrl}" width="32" height="32" onerror="this.onerror=null;this.src='https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png';" />
       <div class="email">${escapedEmail}</div>
     </div>
     <div class="subtitle">읽지 않은 메일 수</div>
     <div class="badge">${unreadCount} 개</div>
     <div class="subtitle">최근 메일 제목</div>
     <div class="subject" title="${escapedSubject}">${escapedSubject}</div>
   </div>
 </div>
 <div class="card" style="margin-top:20px;">
   <h3 style="display: flex; flex-wrap: wrap; justify-content: center; position:relative; top:-20px">수행평가</h3>
   <div class="search_su">
     <input type="text" id="search-input" placeholder="수행평가 검색" oninput="onSearchChange()" style="width: 204px; padding: 8px; border-radius: 8px; border: 1px solid #ccc; position:relative; top:-20px;" />
   </div>
   <ul id="task-list"></ul>
   <div id="pagination"></div>
   <div class="center-controls">
     <button class="hide_list_button" onclick="toggleHiddenTasks()">숨긴 과제 목록</button>
   </div>
   <div id="hidden-tasks">
    <ul id="hidden-tasks-list"></ul>
   </div>
 </div>
</body>
</html>
`;

    return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function addNineHoursToDateTime(datetimeStr) {
    const [datePart, timePart] = datetimeStr.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    date.setHours(date.getHours() + 1); // 9시간 → 한국 시간 기준으로 사용
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
}

function addHiddenTaskId(taskId) {
    const scriptProperties = PropertiesService.getScriptProperties();
    const current = JSON.parse(scriptProperties.getProperty("hiddenTaskIds") || "[]");
    if (!current.some(item => item.id === taskId)) {
        current.push({ id: taskId, deletedAt: Date.now() });
        scriptProperties.setProperty("hiddenTaskIds", JSON.stringify(current));
    }
}

function getValidHiddenTaskIds() {
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const scriptProperties = PropertiesService.getScriptProperties();
    let list = JSON.parse(scriptProperties.getProperty("hiddenTaskIds") || "[]");
    list = list.map(item => {
        const expired = now - item.deletedAt >= THREE_DAYS;
        return { ...item, expired };
    });
    scriptProperties.setProperty("hiddenTaskIds", JSON.stringify(list));
    return list.map(item => item.id);
}

function getClassroomCoursework() {
    const results = [];
    const now = new Date();
    const hiddenIds = getValidHiddenTaskIds();  // 숨김 이력이 3일이 지나도 유지되는 ID 목록
    const keywordList = ["수행평가", "수행 평가"];
    const courses = Classroom.Courses.list().courses;
    if (!courses || courses.length === 0) return results;
    for (const course of courses) {
        if (course.courseState !== "ACTIVE") continue;
        const coursework = Classroom.Courses.CourseWork.list(course.id).courseWork;
        if (!coursework) continue;
        for (const work of coursework) {
            const contentToCheck = (work.title || "") + " " + (work.description || "");
            const hasKeyword = keywordList.some(keyword => contentToCheck.includes(keyword));
            if (!hasKeyword) continue;
            let dueDateStr = "마감일 없음";
            let dueDate = null;
            if (work.dueDate) {
                dueDate = new Date(
                    work.dueDate.year,
                    work.dueDate.month - 1,
                    work.dueDate.day,
                    work.dueTime?.hours || 0,
                    work.dueTime?.minutes || 0
                );
                dueDate.setHours(dueDate.getHours() + 8);  // 시간 보정
                if (dueDate < now) continue;
                dueDateStr = Utilities.formatDate(
                    dueDate,
                    Session.getScriptTimeZone(),
                    "yyyy-MM-dd HH:mm"
                );
            }

            // 과제 고유 ID 생성
            const taskId = `task-${(work.title + "-" + course.name + "-" + work.alternateLink)
                .replace(/\s+/g, '')
                .replace(/[^a-zA-Z0-9-_]/g, '')}`;

            // 숨김 ID에 포함되면 표시하지 않음
            if (hiddenIds.includes(taskId)) continue;

            results.push({
                title: work.title,
                courseName: course.name,
                dueDateStr,
                dueDateObj: dueDate,
                alternateLink: work.alternateLink,
                creationTime: work.creationTime
            });
        }
    }
    return results;
}