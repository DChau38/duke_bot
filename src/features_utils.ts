import { TextChannel, EmbedBuilder, AttachmentBuilder, CommandInteraction, ChannelType, Guild } from "discord.js";
import { tracker, client } from "./setup";

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

export const reminder_yan = async () => {
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
export const reminder_duke = async () => {
    try {
        const guild = client.guilds.cache.get(process.env.SERVER_ID as string);
        if (guild) {
            const channel = guild.channels.cache.find(
                (ch) => ch.type === ChannelType.GuildText && ch.name === 'aaa'
            ) as TextChannel;

            if (channel) {
                const member = guild.members.cache.find((mem) => mem.user.username === 'duke9999')
                await channel.send(`<@${member?.user.id}> It's time to take a break!`);
            } else {
                console.log("aaa channel not found");
            }
        }
    } catch (error) {
        console.error("Error in sendReminder:", error);
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
