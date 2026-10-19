"use client";

import Tabs from "@/components/ui/Tabs";
import EditableList, { type Row } from "@/components/ui/EditableList";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import { useLegacyBabycam } from "@/lib/babycam/legacyAdapter";
import { useDomainStore } from "@/lib/demo/domainStore";
import { useOpsRooms } from "@/lib/domain/legacySelectors";
import { babycamActions, canBabycamSection } from "@/lib/babycam/actions";

export default function CamMaster() {
const { CAMERAS, CAM_STATUSES, BINDING_BY_ROOM } = useLegacyBabycam();
const { data } = useDomainStore();
const MAMA_ROOMS = useOpsRooms();
const CAMERA_ROWS: Row[] = CAMERAS.map((c, i) => ({
  id: i + 1,
  編號: c.code,
  編碼格式: c.codec,
  位址: c.addr,
  解析度: c.resolution,
  啟用: c.enabled ? "啟用" : "停用",
}));

const ROOM_ROWS: Row[] = MAMA_ROOMS.map((r, i) => ({
  id: i + 1,
  房號: r.room,
  樓層: `${r.room[0]}F`,
  入住狀態: r.vacant ? "空房" : "入住",
  已綁監視器: BINDING_BY_ROOM[r.room]?.camIds.length ?? 0,
}));

const STATUS_ROWS: Row[] = CAM_STATUSES.map((s, i) => ({
  id: i + 1,
  排序: i,
  狀態名稱: s.label,
  畫面處理: s.masked ? "遮蔽畫面" : "顯示影像",
  預設值: s.key === "normal" ? "是" : "",
}));

  return (
    <div className="space-y-4">
      <PlaceholderNotice text="三份清單為後台設定檔，由院方預先建好。監視器清單可由舊系統 cctv_list 匯入；顯示狀態沿用舊系統 9 種，另加「正常顯示」為預設值。" />

      <Tabs
        tabs={[
          {
            key: "camera",
            label: `監視器清單（${CAMERAS.length}）`,
            content: (
              <EditableList
                moduleNo="17"
                fields={[
                  { key: "編號", label: "監視器編號" },
                  { key: "編碼格式", label: "編碼格式", type: "select", options: ["HEVC", "H.264"] },
                  { key: "位址", label: "位址（已遮蔽）" },
                  { key: "解析度", label: "解析度" },
                  { key: "啟用", label: "啟用狀態", type: "select", options: ["啟用", "停用"] },
                ]}
                initialRows={CAMERA_ROWS} rows={CAMERA_ROWS} editAllowed={canBabycamSection(data, "03")} onSave={(row) => { const old = data.cameras[row.id - 1]; const patch = { code: String(row.編號), codec: String(row.編碼格式), sourceLabel: String(row.位址), resolution: String(row.解析度), enabled: row.啟用 === "啟用" }; if (row.id && old) babycamActions.camera(old.id, patch); else babycamActions.addCamera(patch.code, patch.codec, patch.sourceLabel, patch.resolution, patch.enabled); }} onDelete={(id) => babycamActions.removeCamera(data.cameras[id - 1].id)}
                searchPlaceholder="搜尋監視器編號或編碼格式"
              />
            ),
          },
          {
            key: "room",
            label: `房號清單（${MAMA_ROOMS.length}）`,
            content: (
              <EditableList
                moduleNo="17"
                fields={[
                  { key: "房號", label: "房號" },
                  { key: "樓層", label: "樓層" },
                  { key: "入住狀態", label: "入住狀態" },
                  { key: "已綁監視器", label: "已綁監視器支數", type: "number" },
                ]}
                initialRows={ROOM_ROWS} rows={ROOM_ROWS} editAllowed={canBabycamSection(data, "04")} onSave={(row) => babycamActions.room(String(row.房號), data.rooms.find((room) => room.room === String(row.房號))?.roomType ?? "精緻", true)} onDelete={(id) => babycamActions.room(MAMA_ROOMS[id - 1].room, data.rooms.find((room) => room.room === MAMA_ROOMS[id - 1].room)?.roomType ?? "精緻", false)}
                searchPlaceholder="搜尋房號或樓層"
              />
            ),
          },
          {
            key: "status",
            label: `顯示狀態清單（${CAM_STATUSES.length}）`,
            content: (
              <EditableList
                moduleNo="17"
                fields={[
                  { key: "排序", label: "排序", type: "number" },
                  { key: "狀態名稱", label: "狀態名稱" },
                  {
                    key: "畫面處理",
                    label: "畫面處理",
                    type: "select",
                    options: ["顯示影像", "遮蔽畫面"],
                  },
                  { key: "預設值", label: "預設值" },
                ]}
                initialRows={STATUS_ROWS} rows={STATUS_ROWS} editAllowed={canBabycamSection(data, "04")} onSave={(row) => babycamActions.displayMaster(data.displayStates[row.id - 1]?.key ?? "", String(row.狀態名稱), row.畫面處理 === "遮蔽畫面", Number(row.排序))} onDelete={(id) => babycamActions.removeDisplay(data.displayStates[id - 1].key)}
                searchPlaceholder="搜尋狀態名稱"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
