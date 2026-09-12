import { DriveItem as BaseDriveItem } from "./FileExplorer";

export interface DriveItem extends BaseDriveItem {
  parentId: string | null;
}
