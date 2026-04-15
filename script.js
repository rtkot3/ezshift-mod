  (function() {
      'use strict';

      const TARGET_URL = "https://app.ezshift.co.il/pages/ScheduleMy.aspx";
      if (!location.href.startsWith(TARGET_URL)) return;

      // --- 1. КОНСТАНТЫ И СОСТОЯНИЕ ---
      const CONFIG = {
          version: "3.3",
          darkness: 35,
          repoUrl: "https://github.com/rtkot3/ezshift-mod"
      };

      const CONSTANTS = {
          DAYS_OF_WEEK: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          MONTHS: { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 },
          MONTH_NAMES: { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 }
      };

      const validShiftTypes = ["LMNG", "MNG", "DPEAK", "AFT", "PEAK", "LNGT", "NGT", "LAFT", "NPEAK"];

      const State = {
          peopleData: [] // Здесь будем хранить загруженные данные
      };

      // --- 2. УТИЛИТЫ ---
      const Utils = {
          isLoading() {
              return document.querySelectorAll('img[alt=""][src="../imgs/EZLoading_dots1.gif"][style="height:50px;padding: 0px;"]').length > 0;
          },

          darkenColor(hex, percent) {
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
          },

          calculateMonthOffset(dateStr) {
              if (!dateStr) return 0;
              const [monthStr, yearStr] = dateStr.split(' ');
              const month = CONSTANTS.MONTHS[monthStr];
              const year = parseInt(yearStr, 10);
              if (month === undefined || isNaN(year)) return 0;
              
              const now = new Date();
              return (year - now.getFullYear()) * 12 + (month - now.getMonth());
          }
      };

      // --- 3. ИНТЕРФЕЙС И DOM ---
      const UI = {
          injectStyles() {
              const styleTag = document.createElement('style');
              styleTag.innerHTML = `
                  #MonthCalCard {
                      overflow-x: auto;
                      -webkit-overflow-scrolling: touch;
                  }
              `;
              
              const handleResize = (e) => {
                  if (e.matches) document.head.appendChild(styleTag);
                  else if (styleTag.parentNode) document.head.removeChild(styleTag);
              };

              const mq = window.matchMedia('(max-width: 380px)');
              mq.addEventListener('change', handleResize);
              handleResize(mq);
          },

          injectLayout() {
              const versionTarget = document.querySelector('.me-auto');
              if (versionTarget) {
                  versionTarget.insertAdjacentHTML('beforeend', ` <br><a href="${CONFIG.repoUrl}" class="gh-link">GitHub</a><span style="color: #b9b9b9; font-size: 12px; font-weight: 400;"> r3 v${CONFIG.version}</span></div>`);
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
          },

          highlightActiveDay(dayOfMonth, isActive) {
              document.querySelectorAll('#MonthCal tr .px-1 span')?.forEach(span => {
                  const match = span.innerText.trim().match(/(\d+)\//);
                  if (match && Number(match[1]) === dayOfMonth) {
                      const day = span.closest('.px-1');
                      day.style.cssText = isActive
                          ? "background-color:#21d6ad1a;cursor:pointer;border:1px solid #21d6ad;color:darkgreen;border-radius:5px;"
                          : "background-color:#f7f8fb;border-radius:5px;";
                  }
              });
          },

          clearShiftsTable() {
              const table = document.querySelector('#ShiftsTable');
              if (table) table.innerHTML = "";
          },

          appendShiftRow(dayOfMonth, month, color, text) {
              const table = document.querySelector('#ShiftsTable');
              if (!table) return;

              const now = new Date();
              const year = now.getFullYear();
              const shiftDate = new Date(year, month - 1, dayOfMonth);
              const dayName = CONSTANTS.DAYS_OF_WEEK[shiftDate.getDay()];
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
          },

          updatePeopleSelect(people) {
              const selectEl = document.querySelector('#r3_people_select');
              selectEl.innerHTML = "";
              if (people.length) {
                  people.forEach(({ name }) => {
                      const opt = document.createElement("option");
                      opt.value = name;
                      opt.textContent = name;
                      selectEl.appendChild(opt);
                  });
              } else {
                  selectEl.innerHTML = '<option value="">No matches</option>';
              }
          }
      };

      // --- 4. РАБОТА С СЕТЬЮ (API) ---
      const API = {
          async fetchScheduleData(offset = 0) {
              const url = `https://app.ezshift.co.il/pages/SchedulePeriod.aspx?Period=${offset}`;
              try {
                  const response = await fetch(url, { credentials: 'include' });
                  const htmlText = await response.text();
                  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                  const table = doc.querySelector('#shifts-area');
                  if (!table) return [];
                  
                  const days = [...table.querySelectorAll('thead th .dayTitleInner div[id^="dayCaption"]')].map(div => {
                      const text = div.textContent.trim();
                      const parts = text.split(" ");
                      return {
                          day: parseInt(parts[1], 10),
                          month: CONSTANTS.MONTH_NAMES[parts[2]] || null,
                          fullDate: `${parts[1]}/${CONSTANTS.MONTH_NAMES[parts[2]]}`
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

                                  const words = shiftTitle.toUpperCase().split(' ');
                                  const foundType = words.find(word => validShiftTypes.includes(word));
                                  const shiftType = foundType ? foundType : 'none';

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
                                              color,
                                              shiftType
                                          });
                                      }
                                  });
                              });
                          });
                      });
                  });

                  console.log("Fetched Data:", data);

                  const dateSel = document.querySelector('#r3_date_select');
                  const areaSel = document.querySelector('#r3_area_select');
                  if (dateSel && areaSel) {
                      dateSel.innerHTML = days.map(d => `<option value="${d.fullDate}">${d.fullDate}</option>`).join('');
                      areaSel.innerHTML = Array.from(areas).sort().map(a => `<option value="${a}">${a}</option>`).join('');
                      dateSel.disabled = false;
                      areaSel.disabled = false;
                  }

                  return Object.entries(data).map(([name, shifts]) => ({ name, shifts }));
              } catch (err) {
                  console.error("EZShift Fetch Error:", err);
                  return null;
              }
          }
      };

      // --- 5. ОБРАБОТЧИКИ СОБЫТИЙ (ЛОГИКА) ---
      const Handlers = {
          async onGetData(e) {
              const btn = e.currentTarget;
              const uiEls = {
                  input: document.querySelector('#r3_input'),
                  select: document.querySelector('#r3_people_select'),
                  status: document.querySelector('#r3_status'),
                  hiddenBlock: document.querySelector('#r3_hidden_block'),
                  team: document.querySelector('#r3_team'),
                  imposterList: document.querySelector('#r3_imposters_list')
              };

              if (uiEls.team) { uiEls.team.innerText = "No Data"; uiEls.team.style.color = "inherit"; }
              if (uiEls.imposterList) uiEls.imposterList.innerHTML = '<div class="d-flex mb-1" style="justify-content: space-between;"><span>No Data</span></div>';
              
              btn.style.opacity = "0.6";
              btn.style.pointerEvents = "none";
              
              let dotCount = 0;
              let dotsInterval = null;
              if (uiEls.status) {
                  uiEls.status.style.color = "orange";
                  uiEls.status.textContent = "Loading";
                  dotsInterval = setInterval(() => {
                      dotCount = (dotCount + 1) % 4;
                      uiEls.status.textContent = "Loading" + ".".repeat(dotCount);
                  }, 500);
              }
              
              uiEls.input.value = '';
              uiEls.input.disabled = true;
              uiEls.select.innerHTML = '';
              uiEls.select.disabled = true;
              if (uiEls.hiddenBlock) uiEls.hiddenBlock.style.display = 'none';
              
              try {
                  const scheduleTitle = document.querySelector('#ScheduleTitle')?.innerText;
                  const offset = Utils.calculateMonthOffset(scheduleTitle);
                  const rawData = await API.fetchScheduleData(offset);
                  
                  State.peopleData = rawData || [];
              
                  if (State.peopleData.length) {
                      State.peopleData.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
                      uiEls.input.disabled = false;
                      uiEls.select.disabled = false;
                      if (uiEls.hiddenBlock) uiEls.hiddenBlock.style.display = 'block';
              
                      UI.updatePeopleSelect(State.peopleData);
                      
                      if (uiEls.status) {
                          uiEls.status.textContent = document.querySelector('#ScheduleTitle')?.innerHTML || "Active";
                          uiEls.status.style.color = "green";
                      }
                  } else {
                      uiEls.select.innerHTML = '<option value="">No Data</option>';
                      if (uiEls.status) { uiEls.status.textContent = "No Data"; uiEls.status.style.color = "red"; }
                  }
              } catch (err) {
                  if (uiEls.status) { uiEls.status.textContent = "Error"; uiEls.status.style.color = "red"; }
              } finally {
                  if (dotsInterval) clearInterval(dotsInterval);
                  btn.style.opacity = "1";
                  btn.style.pointerEvents = "auto";
              }
          },

          onPerformSearch() {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              
              const selectedName = document.querySelector('#r3_people_select')?.value;
              if (!selectedName) return;
              
              const person = State.peopleData.find(p => p.name === selectedName);
              if (!person) return;

              // Подсчет основной команды
              const teamCounts = {};
              person.shifts.forEach(s => {
                  if (s.area !== 'SL' && s.area !== 'ABSENCE') {
                      if (!teamCounts[s.area]) teamCounts[s.area] = { count: 0, color: s.color };
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
                  teamEl.style.color = Utils.darkenColor(mainColor, CONFIG.darkness);
              }

              // Рендер смен
              UI.clearShiftsTable();
              const shiftDays = new Set(person.shifts.map(s => s.day));
              
              for (let day = 1; day <= 31; day++) {
                  UI.highlightActiveDay(day, shiftDays.has(day));
              }
              
              person.shifts.forEach(shift => {
                  UI.appendShiftRow(shift.day, shift.month, shift.color, shift.shift);
              });

              document.getElementById('sidebar-close-btn')?.click();
          },

          onSearchInput(e) {
              const searchQuery = e.target.value.toLowerCase();
              const filtered = State.peopleData.filter(({ name }) => name.toLowerCase().includes(searchQuery));
              UI.updatePeopleSelect(filtered);
          },

          onFindImposters() {
            const selectedDate = document.querySelector('#r3_date_select')?.value;
            const selectedArea = document.querySelector('#r3_area_select')?.value;
            const listContainer = document.querySelector('#r3_imposters_list');
            
            if (!selectedDate || !selectedArea || !State.peopleData.length) return;

            listContainer.innerHTML = "";

            // 1. Задаем приоритет (чем меньше число, тем выше в списке)
            const shiftPriority = {
                "LNGT": 1,
                "NGT": 2,
                "LMNG": 3,
                "MNG": 4,
                "AFT": 5,
                "DPEAK": 6,
                "LAFT": 7,
                "PEAK": 8,
                "NPEAK": 9,
                "none": 10
            };

            // 2. Фильтруем и подготавливаем данные
            let imposters = State.peopleData.filter(person => {
                const currentShift = person.shifts.find(s => s.fullDate === selectedDate && s.area === selectedArea);
                if (!currentShift) return false;

                // Сохраняем тип текущей смены для сортировки
                person.tempCurrentShiftType = currentShift.shiftType || 'none';

                // Определяем основную команду
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

            // 3. СОРТИРОВКА
            imposters.sort((a, b) => {
                const priorityA = shiftPriority[a.tempCurrentShiftType] || 99;
                const priorityB = shiftPriority[b.tempCurrentShiftType] || 99;
                return priorityA - priorityB;
            });

            // 4. Отрисовка
            if (imposters.length === 0) {
                listContainer.innerHTML = '<span>No Imposters ...</span>';
            } else {
                imposters.forEach(imp => {
                    const mainShiftData = imp.shifts.find(s => s.area === imp.tempMain);
                    const color = mainShiftData ? Utils.darkenColor(mainShiftData.color, CONFIG.darkness) : "inherit";
                    
                    const typeText = imp.tempCurrentShiftType !== 'none' ? imp.tempCurrentShiftType : '';

                    const row = document.createElement('div');
                    row.className = "d-flex mb-1 pb-1";
                    row.style.cssText = "align-items: center;justify-content: space-between; border-bottom: 1px solid #ccc;";
                    row.innerHTML = `
                        <span style="max-width: 170px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                            <div class="text-white badge me-2 r3-goto-person" style="border: 2px solid #411f54; background-color: #411f54; cursor: pointer;" data-name="${imp.name}">
                              <span>&gt;</span>
                            </div>${imp.name}
                        </span>
                        <div class="d-flex ps-2" style="flex-direction: column;align-items: end;">
                            <span class="fw-semibold" style="font-size:10px; letter-spacing: 0.5px;">${typeText}</span>
                            <span class="fw-semibold" style="color: ${color};">${imp.tempMain}</span>
                        </div>
                    `;
                    listContainer.appendChild(row);
                });

                // Навешиваем клики (переход к профилю человека)
                listContainer.querySelectorAll('.r3-goto-person').forEach(btn => {
                    btn.addEventListener('click', Handlers.onGotoPerson);
                });
            }
        },

          onGotoPerson(e) {
              const name = e.currentTarget.getAttribute('data-name');
              const inputEl = document.querySelector('#r3_input');
              const selectEl = document.querySelector('#r3_people_select');
              
              if (inputEl && selectEl) {
                  inputEl.value = name;
                  inputEl.dispatchEvent(new Event('input'));
                  selectEl.value = name;
                  Handlers.onPerformSearch();
              }
          }
      };

      // --- 6. ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ ---
      function initializeScript() {
          if (document.getElementById('r3_find')) return; // Защита от двойной инициализации

          UI.injectStyles();
          UI.injectLayout();

          // Привязка событий к элементам
          document.querySelector('#r3_getdata')?.addEventListener('click', Handlers.onGetData);
          document.querySelector('#r3_find')?.addEventListener('click', Handlers.onPerformSearch);
          document.querySelector('#r3_input')?.addEventListener('input', Handlers.onSearchInput);
          document.querySelector('#r3_area_find')?.addEventListener('click', Handlers.onFindImposters);

          console.clear();
          console.log(`[r3 v${CONFIG.version}] Script loaded and initialized successfully!`);
      }

      // Запуск (ожидание исчезновения спиннера загрузки)
      if (!Utils.isLoading()) {
          initializeScript();
      } else {
          const observer = new MutationObserver(() => {
              if (!Utils.isLoading()) {
                  observer.disconnect();
                  initializeScript();
              }
          });
          observer.observe(document.body, { childList: true, subtree: true });
      }

  })();
