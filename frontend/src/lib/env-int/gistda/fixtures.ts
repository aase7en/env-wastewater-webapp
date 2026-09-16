/**
 * ENV-INT-GISTDA-CORE-001 — sanitized GISTDA PM2.5 test fixtures.
 *
 * Source: source-contract packet
 * A-Wiki/inbox/ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md §11 (public
 * environmental fields only; retrieval 2026-09-02 ICT). The service is
 * anonymous/no-auth, so these payloads contain no credentials of any kind.
 * History F1 is trimmed to 3 points with the real envelope shape; the Pred3
 * envelope wraps the packet's complete Uthai record plus one sibling amphoe
 * row to pin target selection. Every value is provider-published public
 * environmental data.
 */

/** F1 — getPM25byAmphoe24hrs?ap_idn=1414 (trimmed to 3 points; envelope real). */
export const HISTORY_OK = {
  status: 200,
  errMsg: "",
  data: {
    status: 200,
    errMsg: "",
    graphHistory24hrs: [
      [18.652550168939534, "2026-09-01T11:00:00.000Z"],
      [17.099281, "2026-09-01T13:00:00.000Z"],
      [18.47766330498679, "2026-09-02T10:00:00.000Z"],
    ],
    graphMetadata: ["pm25", "dt"],
    datetimeThai: { dateThai: "วันพุธที่ 2 กันยายน 2569", timeThai: "เวลา 10:00 น." },
    datetimeEng: { dateEng: "Wednesday 2 September 2026", timeEng: "10:00" },
  },
} as const;

/** F2 — getPm25byAmphoePred3?pv_idn=14: Uthai record (complete) + one sibling. */
export const PRED3_OK = {
  status: 200,
  errMsg: "",
  data: [
    {
      ap_tn: "อุทัย",
      ap_en: "Uthai",
      ap_idn: 1414,
      pm25: 18.477663304986795,
      dt: "2026-09-02T10:00:00.000Z",
      pm25Avg24hr: 17.618048947437366,
      pred1: 19.135530385777145,
      pred2: 17.492736433405994,
      pred3: 16.643137335873625,
    },
    {
      ap_tn: "วัดท่าช้าง",
      ap_en: "Wat Tha Chang",
      ap_idn: 1401,
      pm25: 20.1,
      dt: "2026-09-02T10:00:00.000Z",
      pm25Avg24hr: 19.9,
      pred1: 21.2,
      pred2: 20.8,
      pred3: 20.0,
    },
  ],
} as const;

/** F7-style — provider-verified empty envelope shape (data: []). */
export const EMPTY_DATA_ARRAY = { status: 200, errMsg: "", data: [] } as const;

/** History envelope with an empty graph (same real shape, zero points). */
export const HISTORY_EMPTY = {
  ...HISTORY_OK,
  data: { ...HISTORY_OK.data, graphHistory24hrs: [] },
} as const;

/** F9-style — provider error envelope. */
export const PROVIDER_ERROR = { status: 500, errMsg: "internal error", data: null } as const;

/** Ingest clock used across tests — ALWAYS distinct from any data time. */
export const RECEIVED_AT = new Date("2026-09-02T04:30:00.000Z"); // 11:30 ICT
