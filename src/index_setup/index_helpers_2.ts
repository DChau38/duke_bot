import { TextChannel, ChannelType, Interaction, GuildMember, Presence, Collection, Guild, Client } from 'discord.js';
import { client } from './client';
import config from '../config/config';
import * as BOT_FUNCTIONS from '../features/features_bot'
import * as UTILS from '../features/features_utils'
import * as HELPERS from '../features/features_helpers'
import { interactionReply, centralErrorHandler, sendEmbed } from '../utils/utils_structuring';
import { activeTimers, addition_timers, deletion_timers, TimerInfo, tracker } from './globalData';

export async function handleTrackerInitialization() {
    try {
        // Step 1: Get variables
        const BOT_GUILDS = client.guilds.cache.values();
        const filteredGuild = process.env.DISCORD_GUILD_ID

        // Step 2: Iterate through guilds, add servers, add members
        for (const guild of BOT_GUILDS) {
            console.log(`(...) SERVER CONNECTION: SUCCESS - ${guild.name} (${guild.id})`);

            // Add guild to tracker, additionTimer, deletionTimer
            tracker.set(guild.id, new Map());
            addition_timers.set(guild.id, new Map());
            deletion_timers.set(guild.id, new Map());

            // Populate trackers with server's members
            await populateTrackers(guild, filteredGuild);
        }
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "handleTrackerInitialization()", error.stack || String(error))

    }


    async function populateTrackers(guild, filteredGuild: string | undefined) {
        // Add bot to tracker
        const currentTime = new Date().toISOString();
        tracker.get(guild.id)!.set('BOT', currentTime);

        // Find Correct Members
        const members = await guild.members.fetch();
        let correctMembers: Collection<string, GuildMember>;
        correctMembers = members;
        // if the guild is our filteredGuild, then select only the members with the specific roles
        if (guild.id === filteredGuild) {
            correctMembers = members.filter((member) => member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)
            )
            );
        }

        // Add Trackers to tracker
        for (const [, member] of correctMembers) {
            const tracker_id = HELPERS.getNicknameOrUsernameElseNull(member.guild, member.user.username) as string;
            if (!member.presence) {
                tracker.get(guild.id)!.set(tracker_id, currentTime);
            } else {
                tracker.get(guild.id)!.set(tracker_id, null);
            }
        }
    }
}

export async function handlePresenceUpdate(oldPresence: Presence | null, newPresence: Presence | null) {
    try {
        // Step 1: Get variables and check for errors
        const data = extractPresenceData(newPresence);
        const {
            tracker_id,
            status,
            member,
            guildDeletionTimers,
            guildAdditionTimers,
            guild,
            serverTracker,
        } = data;

        const presenceUpdateToOffline = (status: string): boolean => status === 'offline';
        // If presenceUpdate's guild == filteredGuild && roles aren't aligned with requiredRoles, then exit
        if (!isValidPresenceUpdate(newPresence!, member)) return;


        // Step 2: Handle offline updates
        const currentTime = new Date().toISOString();
        const offlineAndInTracker = serverTracker!.get(tracker_id) !== null

        if (presenceUpdateToOffline(status)) {
            if (offlineAndInTracker && weShouldNotUpdate(serverTracker!, tracker_id, currentTime)) {
                return;
            }
            // If we reach here, this means that it's either (outOfTracker) || (inTracker && weShouldUpdate)
            serverTracker!.set(tracker_id, currentTime);

            // Since we just updated it, there's no need to add another timer
            if (guildAdditionTimers!.has(tracker_id)) {
                clearTimeout(guildAdditionTimers!.get(tracker_id)!);
            }

            // Add a timer to re-add
            const timeout = setTimeout(() => {
                // If already offline when the timer goes off, retain neweset offline. This is the case where they keep bouncing on and off. The timers is always SLEEPCHECK_CHECK_PERIOD, so it won't wipe supremely long periods
                if (serverTracker!.get(tracker_id) !== null) return;
                // Else if online when timer goes off, set it our current offlineTime. If they continue to remain online, then the deletionTimer will wipe it out in a moment anyways
                serverTracker!.set(tracker_id, currentTime);
                // Delete the other timers (worthless)
                guildAdditionTimers!.delete(tracker_id);
            }, config.times.SLEEPCHECK_CHECK_PERIOD);

            guildAdditionTimers!.set(tracker_id, timeout);
            console.log(`${tracker_id} has gone offline at ${currentTime}`);

        }
        // Step 3 : Handle online updates && they have a record
        // (purely going online when they already have a record means nothing )
        if (!presenceUpdateToOffline(status) && serverTracker!.get(tracker_id)) {
            // If deletionTimer already exists, then it will be deleted within 15m (just return). You don't want to do anything to affect the timer because you want to givem them their 15m
            if (guildDeletionTimers!.has(tracker_id)) return;

            // Else, if deletionTimer doesn't exist add one
            const timeout = setTimeout(() => {
                tracker.get(guild!.id)!.set(tracker_id, null);
                // Delete the other timers (worthless)
                guildDeletionTimers!.delete(tracker_id);
            }, config.times.SLEEPCHECK_CHECK_PERIOD);

            guildDeletionTimers!.set(tracker_id, timeout);
            console.log(`${tracker_id} is now online.`);

        }
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "presenceUpdate()", error.stack || String(error))
    }

    // Extracts presence data and checks for essential fields
    function extractPresenceData(newPresence: Presence | null) {
        if (!newPresence || !newPresence.user || !newPresence.guild) {
            throw new Error("No presence update detected or missing guild/user information.");
        }

        const username = newPresence.user.username;
        const tracker_id = HELPERS.getNicknameOrUsernameElseNull(newPresence.guild, username) as string;
        const status = newPresence.status;
        const member = newPresence.guild.members.cache.get(newPresence.user.id);

        if (!member) {
            throw new Error("Member not found in the guild.");
        }

        const guildDeletionTimers = deletion_timers.get(newPresence.guild.id);
        const guildAdditionTimers = addition_timers.get(newPresence.guild.id);
        const guild = newPresence.guild;
        if (!guild) {
            throw new Error('Guild is undefined in presence update.');
        }
        const serverTracker = tracker.get(guild.id);
        return {
            newPresence,
            tracker_id,
            status,
            member,
            guildDeletionTimers,
            guildAdditionTimers,
            guild,
            serverTracker,
        };


    }

    // Validates if the presence update is from the filteredGuild and if the member has the required role
    function isValidPresenceUpdate(newPresence: Presence, member: GuildMember): boolean {
        const isTargetGuild = newPresence.guild!.id === process.env.DISCORD_GUILD_ID;
        const hasRequiredRole = member.roles.cache.some(role =>
            config.mis.requiredRoles.includes(role.name)
        );
        if (!isTargetGuild) return true;
        return isTargetGuild && hasRequiredRole;
    }
    // (given new vs old offline_entries, which one should be kept?)
    // If the difference is over an hour, keep the old one. Otherwise, update to the newest time
    // This allows us to keep viewing the "real" entry if they keep switching between on and off 
    // In terms of deletion + addition, that will be handled on onlineUpdate
    function weShouldNotUpdate(
        serverTracker: Map<string, string | null>,
        tracker_id: string,
        currentTime: string
    ): boolean {
        const oldTime = serverTracker.get(tracker_id)!;
        const time_diff = new Date(currentTime).getTime() - new Date(oldTime).getTime();

        // Return true if it's too late to update — we don't want to overwrite with a newer time
        return time_diff > config.times.SLEEPCHECK_CHECK_PERIOD;
    }
}


export async function handleInteraction(interaction: Interaction) {
    try {
        // Ignore !CommandInteractions (like Buttons, Select Menus, AutoComplete)
        if (!interaction.isCommand()) return;

        // Step 1: Get Variables
        const { commandName } = interaction;
        const channel = interaction.channel as TextChannel;

        // Step 2: Switch cases to handle different commands
        switch (commandName.toUpperCase()) {
            case 'TEST':
                await BOT_FUNCTIONS.testFunction(interaction);
                break;
            case 'REPLY':
                await
                    interactionReply(interaction, true, './static/Zhu.webp', 'Attack Result', 'Bang! <@target> gets hit!');
                break;
            case 'COINFLIP':
                await BOT_FUNCTIONS.handleCoinFlipInteraction(interaction);
                break;
            case 'HANGMAN':
                await BOT_FUNCTIONS.handleHangmanInteraction(interaction, channel);
                break;
            case 'ATTACK':
                await BOT_FUNCTIONS.handleAttackInteraction(interaction);
                break;
            case 'SLEEP':
                await BOT_FUNCTIONS.handleSleepInteraction(interaction);
                break;
            case 'ARENA':
                await BOT_FUNCTIONS.handleArenaInteraction(interaction);
                break;
            case 'JOINVC':
                await BOT_FUNCTIONS.handleJoinVCInteraction(interaction);
                break;
            case 'TIMERSET':
                await BOT_FUNCTIONS.handleTimerSetInteraction(interaction);
                break;
            case 'TIMERSSHOW':
                await BOT_FUNCTIONS.handleShowServerTimersInteraction(interaction);
                break;
            default:
                console.warn(`Unknown command: ${commandName.toUpperCase()}`);
                break;
        }
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "handleInteraction()", error.stack || String(error))
    }
}

export async function handleDisconnect() {
    console.log('Bot disconnected from Discord.');
    const channel = client.channels.cache.get(config.ids.BIGBROTHER);
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`);
        await sendEmbed(channel as TextChannel, null, "...", "Uhhhh I got to go. I'll be back soon! (@DEVELOPER - this is suppose to be brokennnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn");
    }
}
export async function returnBotLogChannel(guild: Guild) {
    const channel = guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText && ch.name === 'aaa'
    ) as TextChannel;
    if (!channel) {
        throw new Error("returnBotLog() - No Bot Log Channel Found");
    }
    return channel;
}
export function findMemberByUsername(guild: Guild, username: string): GuildMember | null {
    for (const member of guild.members.cache.values()) {
        if (member.user.username === username) {
            return member;
        }
    }
    return null;
}

// sendReminderInBotChannel(username, message) => send a reminder in the bot channel
export async function sendReminderInBotChannel(username: string, message: string, reactions: string[]) {
    try {
        // Step 1: Get variables (guild, botChannel, userId)
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID as string);
        if (!guild) {
            throw new Error("Main Guild Not Found");
        }
        const botChannel = await returnBotLogChannel(guild);
        const userId = HELPERS.getMemberIdStringByUsername(guild, username);
        const userIds = [userId];

        // Step 2: Set Reminder
        sendReminder(botChannel, userIds, message, reactions);
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!;
        await centralErrorHandler(atUser, "setMyScheduledReminder()", error.stack || String(error));

    }
}
// sendReminder(guild, userIds, message) => sends a reminder
export async function sendReminder(channel: TextChannel, userIds: string[], message: string, reactions: string[]): Promise<void> {
    try {
        // Ping users
        if (userIds.length > 0) {
            ``
            const mentions = userIds.map(id => `<@${id}>`).join(' ');
            await channel.send(`${mentions}`);
        }
        // Send Reminder Embed
        const formattedMessage =
            `\`\`\`${message}\`\`\`\n`;
        const embedMessage = await sendEmbed(channel, null, '⏰ Reminder', formattedMessage);

        // Add reactions to the message
        for (const emoji of reactions) {
            await embedMessage.react(emoji);
        }

    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!;
        await centralErrorHandler(atUser, "reminderFunction()", error.stack || String(error));
    }
}
export async function addToActiveTimers(serverId: string, timer: TimerInfo) {
    try {

        // Check to see if serverId is included in activeTimers
        if (!activeTimers.has(serverId)) {
            activeTimers.set(serverId, []);
        }
        // Push timerInfo to serverId => timerInfo
        activeTimers.get(serverId)!.push(timer);

    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!;
        await centralErrorHandler(atUser, "addToActiveTimers()", error.stack || String(error));
    }
}

export async function getTextChannel(
    client: Client,
    serverId: string,
    channelId: string
): Promise<TextChannel | null> {
    try {
        const guild = await client.guilds.fetch(serverId);
        const targetChannel = guild.channels.cache.find(
            (ch) => ch.type === ChannelType.GuildText && ch.name === 'aaa'
        );
        return targetChannel as TextChannel;
    } catch (error) {
        console.error('Failed to fetch text channel:', error);
        return null;
    }
}

