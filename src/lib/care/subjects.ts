import { domainStore } from "../demo/domainStore";

export { CARE_SUBJECTS } from "./seed";

/** 房號僅是目前位置，個案識別與入住／托嬰狀態讀取共用資料。 */
export const careSubject = (id: string) => domainStore.get().subjects.find((subject) => subject.id === id);
