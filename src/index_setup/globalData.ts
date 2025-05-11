/*
Presence Tracker System Documentation

This bot uses a presence tracking system to monitor user online/offline status within each server (guild).

DATA STRUCTURE COMPONENTS---------------------------------------

- tracker: 
  A nested Map structure: Map<serverID, Map<userID, string | null>>.
  It stores the last known offline timestamp for each user, or `null` if online.

- deletion_timers:
  Map<serverID, Map<userID, Timeout>>.
  * When a user comes online, we ALWAYS set a 15-minute timeout (not instantly) before removing their last offline timestamp. This allows users to remain "visible" for 15 minutes after returning online so that they can view their own statuses

- addition_timers:
  Map<serverID, Map<userID, Timeout>>.
  * When a user goes offline, we ALWAYS set a 15-minute timeout (not instantly) before adding their last offline timestamp. This
  If a user briefly goes offline, a timeout delays the update of their
  offline time. This prevents false status changes when they check the bot and
  go back to sleep.

USE CASES SUMMARY ------------------------------------

- If a user goes offline, a timeout that deletes their status is added
    - If the time difference between current and old record is huge, return (they are truly offline don't overwrite the true record or add a timeout)
    - If they were online || timeDiffIsSmall, then overwrite the record + add a timer for deletion
    - (In the timer) - if they are offline, just keep the newest offline (the case where they keep bouncing on and off). If they are online when the timer goes off, then add it to this offlineTimex

- If a user comes online, their last offline time is retained for 15 minutes
  before removal.
    - If they are online and there is no offlineRecord, do nothing
    - If they are online and there is an offlineRecord and no additionTimer, add an additionTimer (they can view it for 15m until it goes off)
    - If they are online and there is an offlineRecord and a additionTimer, do nothing (let it handle it; you want the oldest deletionRecord not to keep resetting the timers so they never delete)
- Since each presenceUpdate adds a 15m timer to reupdate it to it's type, never fear that it will be wrong in terms of your updates of the opposite type
*/
export const tracker: Map<string, Map<string, string | null>> = new Map();
export const deletion_timers: Map<string, Map<string, NodeJS.Timeout>> = new Map();
export const addition_timers: Map<string, Map<string, NodeJS.Timeout>> = new Map();

// When you add a new timer for someone, push the timeout to the list for that user in that server. If no list exists, then createi ti
export type TimerInfo = {
  userId: string;
  startTime: number;        // Date.now()
  duration: number;         // in ms
  description: string;
  timeout: NodeJS.Timeout;  // Optional, just for cleanup
};

export const activeTimers = new Map<string, TimerInfo[]>(); // Map<serverId, TimerInfo[]>
