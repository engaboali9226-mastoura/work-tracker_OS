/** Source: Sahih al-Bukhari 881 / Sahih Muslim 850.
 * The five merits are analogies for arriving in each sequential Friday period;
 * they are NOT claims of literal animal sacrifice or measured "reward points".
 * Current time boundaries are the R283 account-authoritative Friday calculation.
 */
export const NOOR_FRIDAY_VIRTUES_R284 = Object.freeze([
 Object.freeze({number:1,icon:"🐪",label:"بدنة",description:"كأنما قرّب بدنة"}),
 Object.freeze({number:2,icon:"🐄",label:"بقرة",description:"كأنما قرّب بقرة"}),
 Object.freeze({number:3,icon:"🐏",label:"كبشًا أقرن",description:"كأنما قرّب كبشًا أقرن"}),
 Object.freeze({number:4,icon:"🐓",label:"دجاجة",description:"كأنما قرّب دجاجة"}),
 Object.freeze({number:5,icon:"🥚",label:"بيضة",description:"كأنما قرّب بيضة"}),
] as const);
export const NOOR_FRIDAY_VIRTUES_SOURCE_R284="صحيح البخاري (881)، وصحيح مسلم (850)" as const;

export function fridayVirtueR284(number:number) {
 if(!Number.isInteger(number)||number<1||number>5)throw Error("R284_FRIDAY_HOUR_INVALID");
 return NOOR_FRIDAY_VIRTUES_R284[number-1]!;
}
