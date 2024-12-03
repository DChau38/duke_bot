import { EmbedBuilder, AttachmentBuilder, TextChannel, ChannelType, CommandInteraction, VoiceChannel, Guild } from 'discord.js';
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

export const sendEmbed = async (channel: TextChannel, URL: string | null, title: string, description: string) => {
    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(title)
        .setDescription(description);
    let attachment
    if (URL) {
        // Use regular expression to find the part after the last slash
        const fileName = URL.match(/[^/]+$/)?.[0]; // This will capture everything after the last slash
        attachment = new AttachmentBuilder(URL);
        embed.setImage('attachment://' + fileName);

    }
    try {
        if (URL) await channel.send({ embeds: [embed], files: [attachment] });
        else await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending embed:', error);
    }
};

export const interactionReply= async (interaction: CommandInteraction, URL: string | null, title: string, description: string) => {
    try {
        // Define embed object directly without using EmbedBuilder
        const embed: any = {
            color: parseInt('#FF0000', 16),  // Convert hex color to int
            title: title,
            description: description,
            image: URL ? { url: 'attachment://' + URL.match(/[^/]+$/)?.[0] } : undefined
        };

        // Prepare the reply options
        const replyOptions: any = {
            embeds: [embed],  // Directly use the embed object here
            // ephemeral: true    // Make the message ephemeral
        };

        // If URL is provided, add the file to the reply
        if (URL) {
            replyOptions.files = [new AttachmentBuilder(URL)];
        }

        // Send the reply with the prepared options
        await interaction.reply({ content: `<@${interaction.user.id}>` });        await interaction.followUp(replyOptions);
    } catch (error) {
        console.error('Error sending reply:', error);
    }
};


export function kill_week_old_entries() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;  // One week in milliseconds

    // Loop through each userIdentifier and their last offline timestamp
    for (const [userIdentifier, lastOfflineTime] of Object.entries(tracker)) {
        // Skip users who are currently online (whose value is null)
        if (lastOfflineTime === null) {
            continue;
        }

        // Convert the last offline timestamp (string) into a Date object
        const offlineTime = new Date(lastOfflineTime);
        const timeDiff = new Date().getTime() - offlineTime.getTime();

        // If the user has been offline for more than a week, remove them from the tracker
        if (timeDiff > oneWeek) {
            tracker[userIdentifier]=null;
            console.log(`${userIdentifier} has been removed from the tracker as they were offline for over a week.`);
        }
    }
}

export const sendReminder = async () => {
    try {
        const guild = client.guilds.cache.get(process.env.SERVER_ID as string);
        if (guild) {
            const channel = guild.channels.cache.find(
                (ch) => ch.type === ChannelType.GuildText && ch.name === 'aaa'
            ) as TextChannel;

            if (channel) {
                const member = guild.members.cache.find((mem) => mem.user.username === 'yan240')
                await channel.send(`<@${member?.user.id}> Reminder to do one's racket :)`);
            } else {
                console.log("aaa channel not found");
            }
        }
    } catch (error) {
        console.error("Error in sendReminder:", error);
    }
};

export const selectMemberWithRequiredRoles = async () => {
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        const members = await guild.members.fetch();

        const correctMembers = members.filter((member) =>
            member.roles.cache.some((role) =>
                config.mis.requiredRoles.includes(role.name)
            )
        );

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
