import { RootState } from "@/app/store";
import { createSlice, createEntityAdapter, PayloadAction } from "@reduxjs/toolkit";
import * as Expo from "expo-notifications";

/** ------------------------------------------------------------------
 * Type helpers
 * ------------------------------------------------------------------ */
export interface StoredNotification extends Expo.Notification {
  /** Unique identifier Expo provides → request.identifier */
  id: string;
  /** Whether the user has opened / cleared it */
  read: boolean;
}

/** ------------------------------------------------------------------
 * Entity adapter
 * ------------------------------------------------------------------ */
const notificationsAdapter = createEntityAdapter<StoredNotification>({
  selectId: (n) => n.id,
  sortComparer: (a, b) => b.date - a.date, // newest first (Expo injects dates)
});

interface ExtraState {
  unreadCount: number;
  /** persist last opened deep‑link, etc. */
  lastOpenPath?: string | null;
}

type NotificationsState = ReturnType<
  typeof notificationsAdapter.getInitialState<ExtraState>
>;

const initialState: NotificationsState = notificationsAdapter.getInitialState<ExtraState>({
  unreadCount: 0,
  lastOpenPath: null,
});

/** ------------------------------------------------------------------
 * Slice
 * ------------------------------------------------------------------ */
const slice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    /** Add a brand‑new push that just came in (foreground listener) */
    receiveNotification: (state, { payload }: PayloadAction<Expo.Notification>) => {
      const id = payload.request.identifier;
      notificationsAdapter.addOne(state, {
        ...payload,
        id,
        read: false,
      });
      state.unreadCount += 1;
    },

    /** Mark a single notification read (e.g., tap in list) */
    markRead: (state, { payload: id }: PayloadAction<string>) => {
      const entity = state.entities[id];
      if (entity && !entity.read) {
        entity.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    /** Mark *all* read (e.g., when user opens the inbox) */
    markAllRead: (state) => {
      Object.values(state.entities).forEach((n) => {
        if (n) n.read = true;
      });
      state.unreadCount = 0;
    },

    /** Remove one (swipe‑to‑delete) */
    removeNotification: (state, { payload: id }: PayloadAction<string>) => {
      const wasUnread = state.entities[id]?.read === false;
      notificationsAdapter.removeOne(state, id);
      if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
    },

    /** Flush everything (on logout) */
    clearNotifications: () => initialState,

    /** Save the deep‑link path when user taps push from background */
    setLastOpenPath: (state, { payload }: PayloadAction<string | null>) => {
      state.lastOpenPath = payload;
    },
  },
});

export const {
  receiveNotification,
  markRead,
  markAllRead,
  removeNotification,
  clearNotifications,
  setLastOpenPath,
} = slice.actions;

/** ------------------------------------------------------------------
 * Selectors
 * ------------------------------------------------------------------ */
const selectSlice = (state: RootState): NotificationsState =>
  (state as any).notifications ?? initialState;

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationById,
  selectIds: selectNotificationIds,
  selectEntities: selectNotificationEntities,
  selectTotal: selectTotalNotifications,
} = notificationsAdapter.getSelectors(selectSlice);

export const selectUnreadCount = (state: RootState) => selectSlice(state).unreadCount;
export const selectLastOpenPath = (state: RootState) => selectSlice(state).lastOpenPath;

export default slice.reducer;
