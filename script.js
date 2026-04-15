const targetURL = "https://app.ezshift.co.il/pages/ScheduleMy.aspx";
if (location.href.startsWith(targetURL)) {

  function checkLoadingImages() {
    return document.querySelectorAll('img[alt=""][src="../imgs/EZLoading_dots1.gif"][style="height:50px;padding: 0px;"]').length === 0;
  }

  if (checkLoadingImages()) {
    r3_script();
  } else {
    const observer = new MutationObserver(() => {
      if (checkLoadingImages()) {
        r3_script();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function r3_script() {
    if (!document.getElementById('r3_find')) {

      // --- 0. Настройка EZShift ---

      const r3Version = "3.3";

      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
      #MonthCalCard {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch; /* Для плавной прокрутки на iOS */
      }
      `;

      function handleResize(e) {
          if (e.matches) {
              document.head.appendChild(styleTag); // Добавляем стили
          } else {
              if (styleTag.parentNode) {
                  document.head.removeChild(styleTag); // Удаляем стили
              }
          }
      }

      const mq = window.matchMedia('(max-width: 380px)');
      mq.addEventListener('change', handleResize);
      handleResize(mq);

      // --- 1. ВСТАВКА ИНТЕРФЕЙСА ---
      const versionTarget = document.querySelector('.me-auto');
      if (versionTarget) {
          versionTarget.insertAdjacentHTML('beforeend', ` <br><a href="https://github.com/rtkot3/ezshift-mod" class="gh-link">GitHub</a><span style="color: #b9b9b9; font-size: 12px; font-weight: 400;"> r3 v${r3Version}</span></div>`);
      }

      const menuScheduling = document.querySelector('#sidebar-menu-scheduling');
      if (menuScheduling) {
          menuScheduling.insertAdjacentHTML('beforeend', '<li class="nav-item-divider m-0"></li>');
      }

      const sidebar = document.querySelector('.sidebar-content');
      if (sidebar) {
          const modUI = `
<div class="sidebar-section ms-3 mx-3 mb-2 mt-2">
  <div class="mb-2">
    <span class="fw-semibold fs-lg p-0">Find other people</span>
    <div class="float-end ps-1">
      <div style="border:2px solid #411f54;background-color:#411f54;cursor:pointer;" class="text-white badge" id="r3_getdata">
        <span>+ Get Data</span>
      </div>
    </div>

    <div class="dropdown float-end" style="padding-top:2px;">
      <a style="cursor:pointer;" class="text-body" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="ph-question"></i>
      </a>
      <div class="dropdown-menu dropdown-menu-end text-dark px-2">
        Go to the month you need in EZShift, then click on the Get Data button. 
        The "Active Data" inscription shows the current database that is currently active. 
        For the script to work correctly, you need to uncheck these boxes in the "View daily schedule" tab:
        <div class="dropdown-divider"></div>
        <span class="dropdown-item" style="padding-left:0"><i id="chk_GroupShiftNames" class="ph-circle me-2" style="font-size: 18px; padding-top:2px;"></i>Group by shifts names</span>
        <span class="dropdown-item" style="padding-left:0"><i id="chk_OrderByPositions" class="ph-circle me-2" style="font-size: 18px; padding-top:2px;"></i>Order by positions</span>
      </div>
    </div>
  </div>
  
  <div class="text-center p-2 rounded fw-semibold" style="background-color: #ebebeb">
    Active Data: <span id="r3_status" style="color:red;">No Data</span>
  </div>
  
  <div style="display: none" id="r3_hidden_block">
    <div class="input-group mt-2">
      <span class="input-group-text rounded-0"><i class="ph-user"></i></span>
      <input type="text" id="r3_input" class="form-control rounded-0" placeholder="Name Surename">
    </div>
          
    <select disabled id="r3_people_select" class="text-dark bg-light border p-2 mt-2" style="width:100%"> 
      <option value="">No Data</option> 
    </select>
    
    <div class="mt-2">
      <div class="btn text-white mb-2" id="r3_find" style="background-color:#411F54;cursor:pointer; width: 100%">
        Find<i class="ph-magnifying-glass RotateIconForRTL ms-1"></i>
      </div>

      <span class="fs-lg p-0">Statistics:</span>

      <div class="p-2 rounded mt-1" style="background-color: #ebebeb">
        <div class="d-flex" style="justify-content: space-between;">
          <span>Main Team</span>
          <span id="r3_team" class="fw-semibold" style="color: inherit;">No Data</span>
        </div>
      </div>
    
      <div class="mt-2">
        <span class="fw-semibold fs-lg p-0">Find Imposters</span>
        <div class="dropdown float-end" style="padding-top:2px;">
          <a style="cursor:pointer;" class="text-body" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="ph-question"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-end text-dark px-2">
            The ability to find out if there are people in a given team for whom this team is not their primary team
          </div> 
        </div>
      </div>
    
      <div class="mt-2 d-flex align-items-center">
        <span class="fs-lg p-0 me-2" style="white-space: nowrap;">Date:</span>
        <select disabled id="r3_date_select" class="text-dark bg-light border p-2" style="width:100%"> 
          <option value="">No Data</option> 
        </select>
      </div>
      <div class="mt-2 d-flex align-items-center">
        <span class="fs-lg p-0 me-2" style="white-space: nowrap;">Area:</span>
        <select disabled id="r3_area_select" class="text-dark bg-light border p-2" style="width:100%"> 
          <option value="">No Data</option> 
        </select>
      </div> 

      <div class="btn text-white mt-2" id="r3_area_find" style="background-color:#411F54;cursor:pointer; width: 100%">
        Find<i class="ph-magnifying-glass RotateIconForRTL ms-1"></i>
      </div>
    
      <div class="mt-2"><span class="fs-lg p-0">List of possible people:</span></div>
      <div id="r3_imposters_list" class="p-2 rounded mt-1 pb-1" style="background-color: #ebebeb">
        <div class="d-flex mb-1" style="justify-content: space-between;"></div>
      </div>
    </div>
  </div>
</div>`;
          sidebar.insertAdjacentHTML('beforeend', modUI);
      }

      // --- 2. КОНСТАНТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
      const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const MONTHS = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };
      const MONTH_NAMES = {
        Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
        Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
      };

      function r3Darken(hex, percent) {
        if (!hex || hex === 'black') return 'black';
        try {
            let r = parseInt(hex.substring(1, 3), 16);
            let g = parseInt(hex.substring(3, 5), 16);
            let b = parseInt(hex.substring(5, 7), 16);
            r = Math.floor(r * (100 - percent) / 100);
            g = Math.floor(g * (100 - percent) / 100);
            b = Math.floor(b * (100 - percent) / 100);
            return `rgb(${r}, ${g}, ${b})`;
        } catch(e) { return hex; }
      }

      function r3ActiveDay(dayOfMonth, isActive) {
        document.querySelectorAll('#MonthCal tr .px-1 span')?.forEach(span => {
          const match = span.innerText.trim().match(/(\d+)\//);
          if (match && Number(match[1]) === dayOfMonth) {
            const day = span.closest('.px-1');
            day.style.cssText = isActive
              ? "background-color:#21d6ad1a;cursor:pointer;border:1px solid #21d6ad;color:darkgreen;border-radius:5px;"
              : "background-color:#f7f8fb;border-radius:5px;";
          }
        });
      }

      function r3ChangeShift(dayOfMonth, month, color, text) {
        const table = document.querySelector('#ShiftsTable');
        if (!table) return;

        if (dayOfMonth === false) {
          table.innerHTML = "";
          return;
        }

        const now = new Date();
        const year = now.getFullYear();
        const shiftDate = new Date(year, month - 1, dayOfMonth);
        const dayName = DAYS_OF_WEEK[shiftDate.getDay()];
        const isPast = shiftDate < new Date(year, now.getMonth(), now.getDate());
        const textColor = isPast ? "lightgray" : "inherit";

        let withIcon = false;
        const match = text.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
        if (match) {
          const [ , startStr, endStr ] = match;
          const [sh, sm] = startStr.split(":").map(Number);
          const [eh, em] = endStr.split(":").map(Number);
          const start = new Date(year, month - 1, dayOfMonth, sh, sm);
          let end = new Date(year, month - 1, dayOfMonth, eh, em);
          if (end <= start) end.setDate(end.getDate() + 1);
          const duration = (end - start) / (1000 * 60 * 60);
          if (duration < 6) withIcon = true;
        }

        const tr = document.createElement("tr");
        tr.style.cssText = "vertical-align:top;border-top:1px solid #E9ECF5";
        tr.innerHTML = `
          <td class="border-0 fw-semibold py-2 px-md-3 px-1" style="color:${textColor};">${dayName}</td>
          <td class="border-0 fw-semibold px-0 py-2" style="color:${textColor};">
            ${String(dayOfMonth).padStart(2, "0")}/${String(month).padStart(2, "0")}
          </td>
          <td class="border-0 py-2 px-md-3 px-1" style="color:${textColor};">
            <div class="p-0">
              <div class="rounded" style="border:2px solid ${color};border-left:7px solid ${color};">
                <span class="p-1 fw-semibold fs-sm">
                  ${withIcon ? `<i class="ph-clock-clockwise float-end ps-1" title="${text}"></i>` : ""}
                  ${text}
                </span>
              </div>
              <span class="fs-sm"></span>
            </div>
          </td>
        `;

        let inserted = false;
        for (let row of table.rows) {
          const [d, m] = row.cells[1].innerText.split('/').map(Number);
          const existingDate = new Date(year, m - 1, d);
          if (shiftDate < existingDate) {
            table.insertBefore(tr, row);
            inserted = true;
            break;
          }
        }
        if (!inserted) table.appendChild(tr);
      }

      async function r3GetData(offset = 0) {
        const url = `https://app.ezshift.co.il/pages/SchedulePeriod.aspx?Period=${offset}`;
        try {
          const response = await fetch(url, { credentials: 'include' });
          const htmlText = await response.text();
          const doc = new DOMParser().parseFromString(htmlText, 'text/html');
          const table = doc.querySelector('#shifts-area');
          if (!table) return [];
          
          const days = [...table.querySelectorAll('thead th .dayTitleInner div[id^="dayCaption"]')]
            .map(div => {
              const text = div.textContent.trim();
              const parts = text.split(" ");
              return {
                day: parseInt(parts[1], 10),
                month: MONTH_NAMES[parts[2]] || null,
                fullDate: `${parts[1]}/${MONTH_NAMES[parts[2]]}`
              };
            });
          
          const data = {};
          const areas = new Set();

          table.querySelectorAll('tbody tr').forEach(row => {
            row.querySelectorAll('td.shiftsArea').forEach((cell, i) => {
              cell.querySelectorAll('.shiftgroupbox').forEach(group => {
                const color = group.getAttribute('shiftgroupboxcolor') || '';
                group.querySelectorAll('.row.m-0.p-0.rounded').forEach(shiftRow => {
                  const shiftTitle = shiftRow.querySelector('.shiftTitleArea1')?.textContent.trim() || '';
                  const areaName = shiftTitle.split(' ')[0].toUpperCase();
                  if (areaName && areaName !== 'SL' && areaName !== 'ABSENCE') {
                    areas.add(areaName);
                  }

                  shiftRow.querySelectorAll('.shiftEmpsArea1 > div').forEach(div => {
                    const emp = div.textContent.trim();
                    if (emp && !emp.includes('Swap this shift')) {
                      data[emp] ??= [];
                      data[emp].push({
                        day: days[i].day,
                        month: days[i].month,
                        fullDate: days[i].fullDate,
                        shift: shiftTitle,
                        area: areaName,
                        color
                      });
                    }
                  });
                });
              });
            });
          });

          const result = Object.entries(data).map(([name, shifts]) => ({ name, shifts }));
          
          const dateSel = document.querySelector('#r3_date_select');
          const areaSel = document.querySelector('#r3_area_select');
          if (dateSel && areaSel) {
              dateSel.innerHTML = days.map(d => `<option value="${d.fullDate}">${d.fullDate}</option>`).join('');
              areaSel.innerHTML = Array.from(areas).sort().map(a => `<option value="${a}">${a}</option>`).join('');
              dateSel.disabled = false;
              areaSel.disabled = false;
          }

          return result;
        } catch (err) {
          console.error(err);
          return null;
        }
      }

      function r3GetMonth(date) {
        const [monthStr, yearStr] = date.split(' ');
        const month = MONTHS[monthStr];
        const year = parseInt(yearStr, 10);
        if (month === undefined || isNaN(year)) return 0;
        const now = new Date();
        return (year - now.getFullYear()) * 12 + (month - now.getMonth());
      }

      // --- 3. ИНИЦИАЛИЗАЦИЯ И СОБЫТИЯ ---
      let result = [];

      document.getElementById('r3_getdata')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const inputEl = document.querySelector('#r3_input');
        const selectEl = document.querySelector('#r3_people_select');
        const statusEl = document.querySelector('#r3_status');
        const hiddenBlock = document.querySelector('#r3_hidden_block');
        const teamEl = document.querySelector('#r3_team');
        const imposterList = document.querySelector('#r3_imposters_list');

        if (teamEl) { teamEl.innerText = "No Data"; teamEl.style.color = "inherit"; }
        if (imposterList) {
          imposterList.innerHTML = '<div class="d-flex mb-1" style="justify-content: space-between;"><span>No Data</span></div>';
        }
      
        btn.style.opacity = "0.6";
        btn.style.pointerEvents = "none";
      
        let dotCount = 0;
        let dotsInterval = null;
        if (statusEl) {
          statusEl.style.color = "orange";
          statusEl.textContent = "Loading";
          dotsInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            statusEl.textContent = "Loading" + ".".repeat(dotCount);
          }, 500);
        }
      
        inputEl.value = '';
        inputEl.disabled = true;
        selectEl.innerHTML = '';
        selectEl.disabled = true;
        if (hiddenBlock) hiddenBlock.style.display = 'none';
      
        try {
          const res = await r3GetData(r3GetMonth(document.querySelector('#ScheduleTitle').innerText));
          result = res || [];
      
          if (result.length) {
            result.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
            inputEl.disabled = false;
            selectEl.disabled = false;
            if (hiddenBlock) hiddenBlock.style.display = 'block';
      
            result.forEach(({ name }) => {
              const opt = document.createElement("option");
              opt.value = name;
              opt.textContent = name;
              selectEl.appendChild(opt);
            });
            
            if (statusEl) {
                statusEl.textContent = document.querySelector('#ScheduleTitle')?.innerHTML || "Active";
                statusEl.style.color = "green";
            }
          } else {
            selectEl.innerHTML = '<option value="">No Data</option>';
            if (statusEl) { statusEl.textContent = "No Data"; statusEl.style.color = "red"; }
          }
        } catch (err) {
          if (statusEl) { statusEl.textContent = "Error"; statusEl.style.color = "red"; }
        } finally {
          if (dotsInterval) clearInterval(dotsInterval);
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
        }
      });

      function r3PerformSearch() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const darkness = 35; 
        const selectEl = document.querySelector('#r3_people_select');
        const selectedName = selectEl.value;
        if (!selectedName) return;
        const person = result.find(p => p.name === selectedName);
        if (!person) return;

        const teamCounts = {};
        person.shifts.forEach(s => {
          if (s.area !== 'SL' && s.area !== 'ABSENCE') {
            if (!teamCounts[s.area]) {
              teamCounts[s.area] = { count: 0, color: s.color };
            }
            teamCounts[s.area].count++;
          }
        });

        let mainTeam = "None";
        let mainColor = "black";
        let maxCount = 0;
        for (const team in teamCounts) {
          if (teamCounts[team].count > maxCount) {
            maxCount = teamCounts[team].count;
            mainTeam = team;
            mainColor = teamCounts[team].color;
          }
        }

        const teamEl = document.querySelector('#r3_team');
        if (teamEl) {
            teamEl.innerText = mainTeam;
            teamEl.style.color = r3Darken(mainColor, darkness);
        }

        r3ChangeShift(false);
        const shiftDays = new Set(person.shifts.map(s => s.day));
        for (let day = 1; day <= 31; day++) {
          r3ActiveDay(day, shiftDays.has(day));
        }
        person.shifts.forEach(shift => {
          r3ChangeShift(shift.day, shift.month, shift.color, shift.shift);
        });

        document.getElementById('sidebar-close-btn')?.click();
      }

      document.querySelector('#r3_find')?.addEventListener('click', r3PerformSearch);

      document.querySelector('#r3_input')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const selectEl = document.querySelector('#r3_people_select');
        selectEl.innerHTML = "";
        const filtered = result.filter(({ name }) => name.toLowerCase().includes(search));
        if (filtered.length) {
          filtered.forEach(({ name }) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            selectEl.appendChild(opt);
          });
        } else {
          const opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "No matches";
          selectEl.appendChild(opt);
        }
      });

      // --- ЛОГИКА FIND IMPOSTERS ---
      document.querySelector('#r3_area_find')?.addEventListener('click', () => {
        const selectedDate = document.querySelector('#r3_date_select').value;
        const selectedArea = document.querySelector('#r3_area_select').value;
        const listContainer = document.querySelector('#r3_imposters_list');
        const darkness = 35;
        
        if (!selectedDate || !selectedArea || !result.length) return;

        listContainer.innerHTML = "";

        const imposters = result.filter(person => {
            const hasShiftInArea = person.shifts.some(s => s.fullDate === selectedDate && s.area === selectedArea);
            if (!hasShiftInArea) return false;

            const counts = {};
            person.shifts.forEach(s => {
                if (s.area !== 'SL' && s.area !== 'ABSENCE') {
                    counts[s.area] = (counts[s.area] || 0) + 1;
                }
            });
            let main = "";
            let max = 0;
            for (const a in counts) {
                if (counts[a] > max) { max = counts[a]; main = a; }
            }
            person.tempMain = main;
            return main !== selectedArea;
        });

        if (imposters.length === 0) {
            listContainer.innerHTML = '<span>No Imposters ...</span>';
        } else {
            imposters.forEach(imp => {
                const mainShiftData = imp.shifts.find(s => s.area === imp.tempMain);
                const color = mainShiftData ? r3Darken(mainShiftData.color, darkness) : "inherit";

                const row = document.createElement('div');
                row.className = "d-flex mb-1 pb-1";
                row.style.cssText = "justify-content: space-between; border-bottom: 1px solid #ccc;";
                row.innerHTML = `
                    <span style="max-width: 170px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                        <div class="text-white badge me-2 r3-goto-person" style="border: 2px solid #411f54; background-color: #411f54; cursor: pointer;" data-name="${imp.name}">
                          <span>&gt;</span>
                        </div>${imp.name}
                    </span>
                    <span class="fw-semibold" style="color: ${color};">${imp.tempMain}</span>
                `;
                listContainer.appendChild(row);
            });

            // Навешиваем обработчик на каждую новую кнопку ">"
            listContainer.querySelectorAll('.r3-goto-person').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const name = e.currentTarget.getAttribute('data-name');
                    const inputEl = document.querySelector('#r3_input');
                    const selectEl = document.querySelector('#r3_people_select');
                    
                    if (inputEl && selectEl) {
                        inputEl.value = name;
                        // Сразу вызываем поиск, чтобы обновить выпадающий список
                        inputEl.dispatchEvent(new Event('input'));
                        selectEl.value = name;
                        // Запускаем отрисовку графика
                        r3PerformSearch();
                    }
                });
            });
        }
      });

      console.clear();
      console.log(`[r3 v${r3Version}] Script loaded successfully!`);
    }
  }
}


// /// --- 0. ЗАГРУЗКА СКРИПТА НА НУЖНОЙ СТРАНИЦЕ ---

// const targetURL = "https://app.ezshift.co.il/pages/ScheduleMy.aspx";

// // Проверяем, совпадает ли адрес страницы
// if (location.href.startsWith(targetURL)) {
//   console.log('Целевая страница обнаружена. Загружаем скрипт...');

//   fetch('https://raw.githubusercontent.com/rtkot3/ezshift-mod/main/script.js')
//     .then(response => {
//       if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
//       return response.text();
//     })
//     .then(code => {
//       // Выполняем полученный код
//       eval(code);
//     })
//     .catch(err => {
//       console.error('Ошибка загрузки модификации:', err);
//     });
// }
