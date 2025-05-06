import { EmbedBuilder, AttachmentBuilder, TextChannel, ChannelType, CommandInteraction, VoiceChannel, Guild, Collection, GuildMember } from 'discord.js';
import config from '../config/config';
import { client } from '../index_setup/client';

export const calculateTimeDifference = (startTime: Date, endTime: Date) => {
    const timeDiff = endTime.getTime() - startTime.getTime();

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
};

export const selectMemberWithRequiredRoles = async () => {
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        const members = await guild.members.fetch();

        let correctMembers:Collection<string,GuildMember>;
        if (guild.id===process.env.DISCORD_GUILD_ID){
            correctMembers = members.filter((member) =>
                member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)) // Check for required roles
            );
        }
        else {
            correctMembers=members;
        }

        return correctMembers.random();
    } catch (error) {
        console.error('Error selecting member with required roles:', error);
        return null;
    }
};

export const selectRandomServerMember = async () => {
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        const members = await guild.members.fetch();

        return members.random();
    } catch (error) {
        console.error('Error selecting random server member:', error);
        return null;
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
