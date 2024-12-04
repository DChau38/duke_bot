import { EmbedBuilder, AttachmentBuilder, TextChannel, ChannelType, CommandInteraction, VoiceChannel, Guild, Collection, GuildMember } from 'discord.js';
import { client, tracker } from './setup';
import config from './config';

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


