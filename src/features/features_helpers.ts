import { EmbedBuilder, AttachmentBuilder, TextChannel, ChannelType, CommandInteraction, VoiceChannel, Guild, Collection, GuildMember } from 'discord.js';
import config from '../config/config';
import { client } from '../index_setup/client';
import * as UTILS from './features_utils'
import { centralErrorHandler } from '../utils/utils_structuring';
import { activeTimers, TimerInfo } from '../index_setup/globalData';

export const selectRandomServerMember = async () => {
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        const members = await guild.members.fetch();

        return members.random();
    } catch (error) {

        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "selectRandomServerMember()", error.stack || String(error))
        return null;
    }
};

export const getNicknameOrUsernameElseNull = (guild: Guild, identifier: string): string | null => {
    // Convert the identifier to lowercase for case-insensitive comparison
    const lowerCaseIdentifier = identifier.toLowerCase();

    // Find the member using the identifier (either username or nickname)
    const member = guild.members.cache.find(
        (m) => m.user.username.toLowerCase() === lowerCaseIdentifier || (m.nickname && m.nickname.toLowerCase() === lowerCaseIdentifier)
    );

    if (member) {
        // If member is found, prioritize nickname if it exists, otherwise return the username
        return (member.nickname ? member.nickname : member.user.username).toLowerCase();
    }

    // If no member was found, return null
    return null;
};


export function getMemberIdStringByUsername(guild: Guild, username: string): string {
    for (const member of guild.members.cache.values()) {
        if (getNicknameOrUsernameElseNull(guild, member.user.username) === username) {
            return member.user.id
        }
    }

    throw new Error(`getMemberIdByUsername(): No member found with username "${username}"`);
}

export const selectMemberWithRequiredRoles = async () => {
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        const members = await guild.members.fetch();

        let correctMembers: Collection<string, GuildMember>;
        if (guild.id === process.env.DISCORD_GUILD_ID) {
            correctMembers = members.filter((member) =>
                member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)) // Check for required roles
            );
        }
        else {
            correctMembers = members;
        }

        return correctMembers.random();
    } catch (error) {

        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "selectMemberWithRequiredRoles()", error.stack || String(error))
    }
};

export function validateVoiceChannel(interaction: CommandInteraction): VoiceChannel {
    if (!interaction.guild) {
        throw new Error("This command can only be used in a server.");
    }

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member || !member.voice || !member.voice.channel) {
        throw new Error("You must be in a voice channel.");
    }

    const channel = member.voice.channel;

    // Check if the channel is a VoiceChannel
    if (channel.isVoiceBased() && channel.type === ChannelType.GuildVoice) {
        return channel as VoiceChannel;
    }

    throw new Error("You must be in a regular voice channel, not a stage channel.");
}

export function returnCommandTimes(command: CommandInteraction) {
    const hours = (command.options.get('hours')?.value || 0) as number;
    const minutes = (command.options.get('minutes')?.value || 0) as number;
    const description = command.options.get('description')?.value;
    const total_ms = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    return { hours, minutes, description, total_ms };
}

// Higher-order function to create comparison functions for TimerInfo sorting
export const strategyFunctionForTimersSort = (sortByArgument?: string) => {
    switch (sortByArgument?.toLowerCase()) {
        case 'alphabetical':
            return (a: TimerInfo, b: TimerInfo) => a.description.localeCompare(b.description);
        case 'finishingTime':
        default: // Default to sorting by finishing time
            return (a: TimerInfo, b: TimerInfo) => (a.startTime + a.duration) - (b.startTime + b.duration);
    }
};

export const seedTestTimers = (serverId: string, userId: string) => {
    const now = Date.now();

    const timers: TimerInfo[] = [
        {
            userId,
            startTime: now,
            duration: 5 * 60 * 1000, // 5 minutes
            description: "Test Timer 1 - Quick",
            timeout: setTimeout(() => { }, 5 * 60 * 1000),
        },
        {
            userId,
            startTime: now,
            duration: 15 * 60 * 1000, // 15 minutes
            description: "Test Timer 2 - Medium",
            timeout: setTimeout(() => { }, 15 * 60 * 1000),
        },
        {
            userId,
            startTime: now,
            duration: 30 * 60 * 1000, // 30 minutes
            description: "Test Timer 3 - Long",
            timeout: setTimeout(() => { }, 30 * 60 * 1000),
        },
    ];
    activeTimers.set(serverId, timers);
};

export const removeFromActiveTimers = async (serverId: string, timeoutToRemove: NodeJS.Timeout) => {
    const timersInformationPerServer = activeTimers.get(serverId);
    if (!timersInformationPerServer) return;

    const updatedTimers = timersInformationPerServer.filter(timer => timer.timeout !== timeoutToRemove);

    activeTimers.set(serverId, updatedTimers);
};

export async function parseMathExpression(input: string): Promise<number | null> {
    try {
        // Evaluate if valid expression
        if (!/^[\d+\-*/().\s]+$/.test(input)) {
            throw new Error("Invalid characters");

        }
        // Return evaluated expression
        return eval(input);
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!;
        await centralErrorHandler(atUser, "parseMathExpression()", error.stack || String(error));
        return null;
    }
}

export const handleTimerSetErrors = (hours: number | null, minutes: number | null) => {
    if (hours === null) {
        throw new Error("Invalid hour input. Please provide a valid number for hours.");
    }

    if (minutes === null) {
        throw new Error("Invalid minute input. Please provide a valid number for minutes.");
    }

    // Check if total time is greater than 0
    const totalTimeInMinutes = (hours * 60) + minutes;
    if (totalTimeInMinutes <= 0) {
        throw new Error("The time must be positive in value");
    }
}
export const timeZoneMap = {
    // North American Time Zones
    EST: 'America/New_York',         // Eastern Standard Time
    EDT: 'America/New_York',         // Eastern Daylight Time
    CST: 'America/Chicago',          // Central Standard Time
    CDT: 'America/Chicago',          // Central Daylight Time
    MST: 'America/Denver',           // Mountain Standard Time
    MDT: 'America/Denver',           // Mountain Daylight Time
    PST: 'America/Los_Angeles',      // Pacific Standard Time
    PDT: 'America/Los_Angeles',      // Pacific Daylight Time
    AKST: 'America/Anchorage',       // Alaska Standard Time
    AKDT: 'America/Anchorage',       // Alaska Daylight Time
    HST: 'Pacific/Honolulu',         // Hawaii Standard Time
    UTC: 'UTC',                      // Coordinated Universal Time
    GMT: 'Etc/GMT',                  // Greenwich Mean Time

    // European Time Zones
    BST: 'Europe/London',            // British Summer Time
    CET: 'Europe/Paris',             // Central European Time
    CEST: 'Europe/Paris',            // Central European Summer Time
    EET: 'Europe/Athens',            // Eastern European Time
    EEST: 'Europe/Athens',           // Eastern European Summer Time

    // Asian Time Zones
    IST: 'Asia/Kolkata',             // India Standard Time
    PKT: 'Asia/Karachi',             // Pakistan Standard Time
    CST_Asia: 'Asia/Shanghai',       // China Standard Time
    JST: 'Asia/Tokyo',               // Japan Standard Time
    KST: 'Asia/Seoul',               // Korea Standard Time

    // Australian Time Zones
    AEST: 'Australia/Sydney',        // Australian Eastern Standard Time
    AEDT: 'Australia/Sydney',        // Australian Eastern Daylight Time
    ACST: 'Australia/Adelaide',      // Australian Central Standard Time
    ACDT: 'Australia/Adelaide',      // Australian Central Daylight Time
    AWST: 'Australia/Perth',         // Australian Western Standard Time

    // Others
    NZST: 'Pacific/Auckland',        // New Zealand Standard Time
    NZDT: 'Pacific/Auckland',        // New Zealand Daylight Time
    WET: 'Europe/Lisbon',            // Western European Time
    WEST: 'Europe/Lisbon',           // Western European Summer Time
    AST: 'America/Halifax',          // Atlantic Standard Time
    ADT: 'America/Halifax',          // Atlantic Daylight Time
};
