import type {ReactElement} from "react";
const paths={
 user:"M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2 M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8",
 userPlus:"M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M10 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M19 7v6 M16 10h6",
 lock:"M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M8 10V7a4 4 0 0 1 8 0v3",
 mail:"M3 5h18v14H3z M3 6l9 7 9-7",
 shield:"M12 2l8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5z M8 12l3 3 5-6",
 layers:"M12 3L2 8l10 5 10-5z M2 12l10 5 10-5 M2 16l10 5 10-5",
 mosque:"M4 21V11c0-2 2-4 8-8 6 4 8 6 8 8v10 M2 21h20 M10 21v-5a2 2 0 0 1 4 0v5",
 leaf:"M12 22V10 M12 9C3 10 2 6 2 2c7 0 10 2 10 7z M12 12C21 12 22 7 22 3c-7 0-10 4-10 9z",
 check:"M15 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M8 11l4 4 9-10",
 bars:"M3 21h18 M5 18V13h4v5 M11 18V8h4v10 M17 18V3h4v15",
 home:"M3 10l9-8 9 8v11h-7v-7h-4v7H3z",
 grid:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 plus:"M12 4v16 M4 12h16",
 bell:"M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9 M10 21h4",
 settings:"M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6",
 arrow:"M15 4l-8 8 8 8"
} as const;
export function NoorR323Icon({name}:{name:keyof typeof paths}):ReactElement{return <svg className="noor-r323-line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>}
