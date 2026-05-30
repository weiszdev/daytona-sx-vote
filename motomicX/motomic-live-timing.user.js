// ==UserScript==
// @name         MotoMic Live Timing
// @namespace    local.motomic
// @version      0.2.0
// @description  Reformat Supercross Live with MotoMic colors, text bike brands, and a dense two-column leaderboard.
// @match        https://live.supercrosslive.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CONFIG = {
    // Options: "two-column", "compact-table"
    brandName: "MotoMic",
    layout: "two-column",
    maxRiders: "auto",
    // Options: "all-riders", "fit-screen"
    rowMode: "all-riders",
    rowsPerColumn: "auto",
    minRowsPerColumn: 5,
    maxRowsPerColumn: "auto",
    estimatedRowHeightPx: 31,
    showVideoSlot: true,
    videoSlotLabel: "",
    showColumns: ["pos", "number", "name", "bike", "last", "best", "gap"],
  };

  const EVENT_SCHEDULE = [
    ["2026-05-30T08:00:00-07:00", "250 Class Qualifying Grp B"],
    ["2026-05-30T08:20:00-07:00", "250 Class Qualifying Grp A"],
    ["2026-05-30T08:35:00-07:00", "Track Maintenance"],
    ["2026-05-30T08:50:00-07:00", "450 Class Qualifying Grp A"],
    ["2026-05-30T09:10:00-07:00", "450 Class Qualifying Grp B"],
    ["2026-05-30T09:30:00-07:00", "Track Maintenance"],
    ["2026-05-30T09:50:00-07:00", "250 Class Qualifying Grp B"],
    ["2026-05-30T10:10:00-07:00", "250 Class Qualifying Grp A"],
    ["2026-05-30T10:30:00-07:00", "450 Class Qualifying Grp A"],
    ["2026-05-30T10:50:00-07:00", "450 Class Qualifying Grp B"],
    ["2026-05-30T11:05:00-07:00", "Track Maintenance"],
    ["2026-05-30T11:35:00-07:00", "250 Consolation Race"],
    ["2026-05-30T11:50:00-07:00", "450 Consolation Race"],
    ["2026-05-30T12:05:00-07:00", "Track Maintenance"],
    ["2026-05-30T12:15:00-07:00", "Opening Ceremonies"],
    ["2026-05-30T13:00:00-07:00", "250 Class Sight Lap"],
    ["2026-05-30T13:15:00-07:00", "250 Class Moto #1"],
    ["2026-05-30T14:00:00-07:00", "450 Class Sight Lap"],
    ["2026-05-30T14:15:00-07:00", "450 Class Moto #1"],
    ["2026-05-30T14:50:00-07:00", "Halftime"],
    ["2026-05-30T15:20:00-07:00", "250 Class Sight Lap"],
    ["2026-05-30T15:30:00-07:00", "250 Class Moto #2"],
    ["2026-05-30T16:05:00-07:00", "250 Winners Circle"],
    ["2026-05-30T16:22:00-07:00", "450 Class Sight Lap"],
    ["2026-05-30T16:30:00-07:00", "450 Class Moto #2"],
    ["2026-05-30T17:05:00-07:00", "450 Winners Circle"],
  ].map(([startTime, session]) => ({
    session,
    startTime: new Date(startTime),
  }));

  const THEME = {
    red: "#ed1c24",
    black: "#030303",
    panel: "#0b0b0b",
    panelAlt: "#151515",
    white: "#f7f7f7",
    muted: "#9a9a9a",
    line: "#2a2a2a",
  };

  const BRAND_COLORS = {
    beta: THEME.red,
    ducati: THEME.red,
    gasgas: THEME.red,
    honda: THEME.red,
    husqvarna: "#2f65b0",
    kawasaki: "#69be28",
    ktm: "#ff6600",
    suzuki: "#f5d300",
    triumph: "#d7d7d7",
    yamaha: "#0057b8",
  };

  const BRAND_LABELS = {
    gasgas: "GAS",
    honda: "HON",
    husqvarna: "HUS",
    kawasaki: "KAW",
    ktm: "KTM",
    triumph: "TRI",
    yamaha: "YAM",
  };

  const STYLE_ID = "smx-live-bike-text-style";
  const LABEL_CLASS = "smx-live-bike-brand";
  const BOARD_ID = "motomic-live-board";

  const TABLE_COLUMNS = [
    ["pos", "Pos", 0],
    ["number", "#", 1],
    ["name", "Rider", 2],
    ["bike", "Bike", 3],
    ["laps", "Laps", 4],
    ["gap", "Gap", 5],
    ["diff", "Diff", 6],
    ["last", "Last", 7],
    ["best", "Best", 8],
    ["in", "In", 9],
    ["status", "Status", 10],
    ["hometown", "Hometown", 12],
  ];

  const BOARD_GRID_COLUMNS = {
    pos: "2.65em",
    number: "3.25em",
    name: "minmax(5em, 1fr)",
    bike: "4.9em",
    laps: "3.4em",
    gap: "4.15em",
    diff: "4.15em",
    last: "4.15em",
    best: "4.15em",
    in: "2.5em",
    status: "5.5em",
    hometown: "minmax(7em, 1fr)",
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body {
        background: ${THEME.black} !important;
      }

      table th:nth-child(4),
      table td:nth-child(4) {
        min-width: 7.5rem;
        text-align: left !important;
      }

      .${LABEL_CLASS} {
        display: inline-flex;
        align-items: center;
        min-height: 1.5rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
        white-space: nowrap;
      }

      body.motomic-compact-table table {
        font-size: clamp(16px, 1.35vw, 24px);
      }

      body.motomic-compact-table .lbtd,
      body.motomic-compact-table th {
        padding-block: 0.2rem !important;
      }

      body.motomic-two-column table {
        display: none !important;
      }

      #${BOARD_ID} {
        width: min(100%, 1920px);
        margin: 0 auto;
        padding: 0.65rem;
        color: ${THEME.white};
        background: ${THEME.black};
        font-family: Arial, Helvetica, sans-serif;
      }

      #${BOARD_ID} .motomic-board-title {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.85rem;
        margin-bottom: 0.55rem;
        border-bottom: 3px solid ${THEME.red};
        padding-bottom: 0.35rem;
        text-transform: uppercase;
      }

      #${BOARD_ID} .motomic-title-main {
        color: ${THEME.white};
        font-size: clamp(17px, 1.5vw, 30px);
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-brand {
        color: ${THEME.red};
        font-size: clamp(19px, 1.8vw, 36px);
        font-weight: 900;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-title-side {
        color: ${THEME.red};
        font-size: clamp(15px, 1.2vw, 24px);
        font-weight: 900;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-next-race {
        display: inline-flex;
        align-items: baseline;
        min-width: 0;
        max-width: 28rem;
        gap: 0.35rem;
        overflow: hidden;
        line-height: 1;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-next-label {
        color: ${THEME.red};
        font-size: clamp(10px, 0.7vw, 14px);
        font-weight: 900;
        flex: 0 0 auto;
      }

      #${BOARD_ID} .motomic-next-session {
        min-width: 0;
        overflow: hidden;
        color: ${THEME.white};
        font-size: clamp(12px, 0.95vw, 18px);
        font-weight: 900;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-next-countdown {
        color: ${THEME.red};
        font-size: clamp(12px, 0.9vw, 17px);
        font-weight: 900;
        flex: 0 0 auto;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-moto-countdowns {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.65rem;
        min-width: max-content;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-moto-chip {
        display: inline-flex;
        align-items: baseline;
        gap: 0.35rem;
        border: 2px solid currentColor;
        padding: 0.18rem 0.4rem;
        font-weight: 900;
        line-height: 1;
      }

      #${BOARD_ID} .motomic-moto-chip.is-250 {
        color: ${THEME.red};
      }

      #${BOARD_ID} .motomic-moto-chip.is-250 .motomic-moto-label {
        color: ${THEME.white};
      }

      #${BOARD_ID} .motomic-moto-chip.is-450 {
        color: #ffffff;
        background: ${THEME.red};
        border-color: ${THEME.red};
      }

      #${BOARD_ID} .motomic-moto-label {
        color: currentColor;
        font-size: clamp(13px, 0.95vw, 18px);
      }

      #${BOARD_ID} .motomic-moto-time {
        color: currentColor;
        font-size: clamp(14px, 1.05vw, 20px);
        font-variant-numeric: tabular-nums;
      }

      #${BOARD_ID} .motomic-moto-chip.is-250 .motomic-moto-time,
      #${BOARD_ID} .motomic-moto-chip.is-450 .motomic-moto-time {
        border: 2px solid ${THEME.red};
        padding: 0.12rem 0.35rem;
        background: ${THEME.black};
        color: ${THEME.white};
      }

      #${BOARD_ID} .motomic-right-strip {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.85rem;
        min-width: 0;
      }

      #${BOARD_ID} .motomic-columns {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 33vw) minmax(0, 1fr);
        gap: 0.75rem;
        position: relative;
      }

      #${BOARD_ID} .motomic-columns::before {
        display: none;
      }

      #${BOARD_ID} .motomic-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.7rem;
      }

      #${BOARD_ID} .motomic-video-slot {
        display: grid;
        align-self: start;
        grid-template-columns: 1fr;
        align-items: center;
        border: 3px solid ${THEME.red};
        padding: 0.45rem;
        background: ${THEME.panel};
      }

      #${BOARD_ID} .motomic-video-frame {
        aspect-ratio: 16 / 9;
        display: grid;
        place-items: center;
        min-height: 0;
        background:
          linear-gradient(135deg, rgba(237, 28, 36, 0.22), transparent 34%),
          #050505;
      }

      #${BOARD_ID} .motomic-column {
        display: grid;
        gap: 0.18rem;
        align-content: start;
      }

      #${BOARD_ID} .motomic-row {
        display: grid;
        column-gap: 0.24rem;
        row-gap: 0;
        align-items: center;
        min-height: 1.85rem;
        padding: 0.12rem 0.45rem;
        border-left: 4px solid transparent;
        background: ${THEME.panel};
        font-size: clamp(14px, 1vw, 21px);
        font-weight: 800;
        line-height: 1;
      }

      #${BOARD_ID} .motomic-cell {
        min-width: 0;
      }

      #${BOARD_ID} .motomic-row:nth-child(even) {
        background: ${THEME.panelAlt};
      }

      #${BOARD_ID} .motomic-header {
        min-height: 1.35rem;
        color: ${THEME.muted};
        background: transparent;
        border-left-color: ${THEME.red};
        font-size: clamp(11px, 0.72vw, 15px);
        letter-spacing: 0;
        text-transform: uppercase;
      }

      #${BOARD_ID} .motomic-header .motomic-cell {
        overflow: hidden;
        text-overflow: clip;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-header .motomic-pos {
        color: ${THEME.muted};
        text-align: left;
      }

      #${BOARD_ID} .motomic-header .motomic-number {
        color: ${THEME.muted};
        padding-left: 0.35rem;
        text-align: left;
      }

      #${BOARD_ID} .motomic-pos {
        color: ${THEME.red};
        font-weight: 900;
      }

      #${BOARD_ID} .motomic-number {
        color: ${THEME.white};
        padding-left: 0.35rem;
      }

      #${BOARD_ID} .motomic-name {
        overflow: hidden;
        padding-right: 0.1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${BOARD_ID} .motomic-time,
      #${BOARD_ID} .motomic-gap {
        color: ${THEME.white};
        font-variant-numeric: tabular-nums;
        text-align: right;
      }

      #${BOARD_ID} .motomic-bike {
        font-size: 0.88em;
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      @media (max-width: 900px) {
        #${BOARD_ID} .motomic-board-title,
        #${BOARD_ID} .motomic-columns {
          grid-template-columns: 1fr;
        }

        #${BOARD_ID} .motomic-columns::before {
          display: none;
        }

      }

      @media (min-width: 901px) and (max-width: 1450px) {
        #${BOARD_ID} .motomic-board-title {
          grid-template-columns: auto minmax(0, 1fr);
        }

        #${BOARD_ID} .motomic-right-strip {
          grid-column: 2 / -1;
          grid-row: 2;
          justify-content: flex-start;
          min-width: 0;
        }

        #${BOARD_ID} {
          padding-inline: 0.4rem;
        }

        #${BOARD_ID} .motomic-columns {
          grid-template-columns: minmax(0, 1fr) minmax(260px, 32vw) minmax(0, 1fr);
          gap: 0.45rem;
        }

        #${BOARD_ID} .motomic-row {
          column-gap: 0.18rem;
          padding-inline: 0.32rem;
          font-size: clamp(13px, 0.88vw, 18px);
        }

        #${BOARD_ID} .motomic-header {
          font-size: 11px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeBrand(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function labelFor(brand) {
    return BRAND_LABELS[brand] || brand.toUpperCase();
  }

  function readEventTitle() {
    const headings = [...document.querySelectorAll("h6")].map((node) =>
      node.textContent.trim()
    );
    return headings.find((text) => text.includes("|")) || headings[0] || "Live Timing";
  }

  function readClock() {
    const heading = [...document.querySelectorAll("h6")]
      .map((node) => node.textContent.trim())
      .find((text) => /time to go/i.test(text));
    return heading || "";
  }

  function parseStartTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatCountdown(startTime) {
    if (!startTime) return "Start TBD";

    const diffMs = startTime.getTime() - Date.now();
    if (diffMs <= 0) return "Starting Now";

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function detectNextRace() {
    const now = Date.now();
    const nextSession = EVENT_SCHEDULE.find(
      (item) => item.startTime.getTime() > now
    );

    if (nextSession) return nextSession;

    return {
      session: "Schedule Complete",
      startTime: null,
    };
  }

  function findScheduleSession(sessionName) {
    return EVENT_SCHEDULE.find((item) => item.session === sessionName) || null;
  }

  function updateCountdowns() {
    document.querySelectorAll(`#${BOARD_ID} .motomic-next-countdown`).forEach((node) => {
      const nextRace = detectNextRace();
      const container = node.closest(".motomic-next-race");
      const session = container?.querySelector(".motomic-next-session");

      if (session) session.textContent = nextRace.session;
      node.dataset.startTime = nextRace.startTime ? nextRace.startTime.toISOString() : "";
      node.textContent = formatCountdown(nextRace.startTime);
    });

    document.querySelectorAll(`#${BOARD_ID} .motomic-moto-time`).forEach((node) => {
      const scheduleItem = findScheduleSession(node.dataset.session);
      node.textContent = scheduleItem
        ? formatCountdown(scheduleItem.startTime)
        : "TBD";
    });
  }

  function readRiders() {
    const riders = [...document.querySelectorAll("table tbody tr")]
      .map((row, index) => {
        const cells = [...row.children];
        const rider = {};

        TABLE_COLUMNS.forEach(([key, , index]) => {
          const cell = cells[index];
          if (!cell) return;

          if (key === "bike") {
            const image = cell.querySelector("img");
            const brand = normalizeBrand(
              image?.getAttribute("alt") ||
                cell.dataset.smxBikeBrand ||
                cell.textContent
            );
            rider.bikeBrand = brand;
            rider[key] = labelFor(brand);
          } else {
            rider[key] = cell.textContent.trim();
          }
        });

        rider.pos = rider.pos || String(index + 1);
        return rider;
      })
      .filter((rider) => rider.pos && rider.name);

    if (CONFIG.maxRiders === "auto") return riders;
    return riders.slice(0, CONFIG.maxRiders);
  }

  function renderCell(row, key, label) {
    const cell = document.createElement("span");
    cell.className = `motomic-cell motomic-${key}`;

    if (key === "last" || key === "best") cell.classList.add("motomic-time");
    if (key === "gap") cell.classList.add("motomic-gap");

    cell.textContent = label ? label : row[key] || "";

    if (key === "bike") {
      cell.style.color = BRAND_COLORS[row.bikeBrand] || THEME.white;
    }

    return cell;
  }

  function renderRow(row, isHeader) {
    const element = document.createElement("div");
    element.className = isHeader ? "motomic-row motomic-header" : "motomic-row";
    element.style.gridTemplateColumns = CONFIG.showColumns
      .map((key) => BOARD_GRID_COLUMNS[key] || "auto")
      .join(" ");

    CONFIG.showColumns.forEach((key) => {
      const column = TABLE_COLUMNS.find(([columnKey]) => columnKey === key);
      if (!column) return;
      element.appendChild(renderCell(row, key, isHeader ? column[1] : ""));
    });

    return element;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getRowsPerColumn(board, totalRiders) {
    if (CONFIG.rowMode === "all-riders") {
      return Math.ceil(totalRiders / 2);
    }

    if (CONFIG.rowsPerColumn !== "auto") {
      return clamp(
        CONFIG.rowsPerColumn,
        CONFIG.minRowsPerColumn,
        CONFIG.maxRowsPerColumn === "auto" ? CONFIG.rowsPerColumn : CONFIG.maxRowsPerColumn
      );
    }

    const boardTop = board.getBoundingClientRect().top;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const availableHeight = Math.max(0, viewportHeight - boardTop);
    const titleEstimate = 58;
    const columnHeaderEstimate = 24;
    const paddingEstimate = 24;
    const usableHeight =
      availableHeight - titleEstimate - columnHeaderEstimate - paddingEstimate;
    const estimatedRows = Math.floor(usableHeight / CONFIG.estimatedRowHeightPx);
    const maxNeeded = Math.ceil(totalRiders / 2);

    return clamp(
      estimatedRows,
      CONFIG.minRowsPerColumn,
      CONFIG.maxRowsPerColumn === "auto"
        ? maxNeeded
        : Math.min(CONFIG.maxRowsPerColumn, maxNeeded)
    );
  }

  function renderTwoColumnBoard() {
    let board = document.getElementById(BOARD_ID);
    const table = document.querySelector("table");
    const allRiders = readRiders();

    if (!table || allRiders.length === 0) return;

    if (!board) {
      board = document.createElement("section");
      board.id = BOARD_ID;
      table.insertAdjacentElement("beforebegin", board);
    }

    const rowsPerColumn = getRowsPerColumn(board, allRiders.length);
    const visibleRiders = allRiders.slice(0, rowsPerColumn * 2);
    const groups = [
      visibleRiders.slice(0, rowsPerColumn),
      visibleRiders.slice(rowsPerColumn, rowsPerColumn * 2),
    ];

    board.replaceChildren();

    const title = document.createElement("div");
    title.className = "motomic-board-title";
    title.innerHTML = `
      <div class="motomic-brand"></div>
      <div class="motomic-title-main"></div>
      <div class="motomic-right-strip">
        <div class="motomic-next-race">
          <span class="motomic-next-label">Next Race:</span>
          <div class="motomic-next-session"></div>
          <div class="motomic-next-countdown"></div>
        </div>
        <div class="motomic-moto-countdowns">
          <div class="motomic-moto-chip is-250">
            <span class="motomic-moto-label">250 Moto 1</span>
            <span class="motomic-moto-time" data-session="250 Class Moto #1"></span>
          </div>
          <div class="motomic-moto-chip is-450">
            <span class="motomic-moto-label">450 Moto 1</span>
            <span class="motomic-moto-time" data-session="450 Class Moto #1"></span>
          </div>
        </div>
      </div>
      <div class="motomic-title-side"></div>
    `;
    const nextRace = detectNextRace();
    title.querySelector(".motomic-brand").textContent = CONFIG.brandName;
    title.querySelector(".motomic-title-main").textContent = readEventTitle();
    title.querySelector(".motomic-next-session").textContent = nextRace.session || "Next session TBD";
    const countdown = title.querySelector(".motomic-next-countdown");
    countdown.dataset.startTime = nextRace.startTime ? nextRace.startTime.toISOString() : "";
    countdown.textContent = formatCountdown(nextRace.startTime);
    title.querySelector(".motomic-title-side").textContent = readClock();
    title.querySelectorAll(".motomic-moto-time").forEach((node) => {
      const scheduleItem = findScheduleSession(node.dataset.session);
      node.textContent = scheduleItem
        ? formatCountdown(scheduleItem.startTime)
        : "TBD";
    });
    board.appendChild(title);

    const columns = document.createElement("div");
    columns.className = "motomic-columns";

    groups.forEach((group, index) => {
      const column = document.createElement("div");
      column.className = "motomic-column";
      column.appendChild(renderRow({}, true));
      group.forEach((rider) => column.appendChild(renderRow(rider, false)));
      columns.appendChild(column);

      if (index === 0 && CONFIG.showVideoSlot) {
        const videoSlot = document.createElement("section");
        videoSlot.className = "motomic-video-slot";
        videoSlot.setAttribute("aria-label", "Video placeholder");
        videoSlot.innerHTML = `
          <div class="motomic-video-frame"></div>
        `;
        videoSlot.querySelector(".motomic-video-frame").textContent =
          CONFIG.videoSlotLabel;
        columns.appendChild(videoSlot);
      }
    });

    const content = document.createElement("section");
    content.className = "motomic-content";

    content.appendChild(columns);
    board.appendChild(content);
  }

  function applyLayout() {
    if (!document.body) return;

    document.body.classList.toggle("motomic-two-column", CONFIG.layout === "two-column");
    document.body.classList.toggle(
      "motomic-compact-table",
      CONFIG.layout === "compact-table"
    );

    const board = document.getElementById(BOARD_ID);
    if (CONFIG.layout === "two-column") {
      renderTwoColumnBoard();
    } else if (board) {
      board.remove();
    }
  }

  function reformatBikeCells() {
    injectStyle();

    document.querySelectorAll("table tbody tr td:nth-child(4)").forEach((cell) => {
      const image = cell.querySelector("img");
      const brand = normalizeBrand(
        image?.getAttribute("alt") ||
          cell.dataset.smxBikeBrand ||
          cell.textContent
      );

      if (!brand) return;

      cell.dataset.smxBikeBrand = brand;
      if (image) image.style.display = "none";

      let label = cell.querySelector(`.${LABEL_CLASS}`);
      if (!label) {
        label = document.createElement("span");
        label.className = LABEL_CLASS;
        cell.appendChild(label);
      }

      label.textContent = labelFor(brand);
      label.style.color = BRAND_COLORS[brand] || "#ffffff";
    });

    applyLayout();
  }

  function scheduleReformat() {
    if (scheduleReformat.pending) return;

    scheduleReformat.pending = true;
    requestAnimationFrame(() => {
      scheduleReformat.pending = false;
      reformatBikeCells();
    });
  }

  const observer = new MutationObserver((mutations) => {
    const hasSourceUpdate = mutations.some((mutation) => {
      const target = mutation.target;
      if (!(target instanceof Element)) return true;
      if (target.closest(`#${BOARD_ID}`) || target.id === STYLE_ID) return false;
      return true;
    });

    if (hasSourceUpdate) scheduleReformat();
  });

  reformatBikeCells();
  window.setInterval(updateCountdowns, 1000);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
