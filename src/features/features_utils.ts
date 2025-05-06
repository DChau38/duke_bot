import { TextChannel, EmbedBuilder, AttachmentBuilder, CommandInteraction, ChannelType, Guild } from "discord.js";
import { client } from "../index_setup/index_helpers";
import { tracker } from "../index_setup/index_helpers_2";

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

export const interactionReply = async (
    interaction: CommandInteraction,
    localUrl: boolean | null,
    URL: string | null,
    title: string,
    description: string
) => {
    try {
        // Define embed object directly without using EmbedBuilder
        const embed: any = {
            color: parseInt('#FF0000', 16),  // Convert hex color to int
            title: title,
            description: description,
            image: undefined // Default to undefined
        };

        // If 'localUrl' is true, use the attachment URL scheme (local file path)
        if (localUrl && URL) {
            embed.image = { url: 'attachment://' + URL.match(/[^/]+$/)?.[0] }; // Use local attachment
        } else if (URL) {
            // If 'localUrl' is false, use the provided full URL
            embed.image = { url: URL }; // Use the full URL
        }

        // Prepare the reply options
        const replyOptions: any = {
            embeds: [embed],  // Directly use the embed object here
            // ephemeral: true    // Make the message ephemeral
        };

        // If URL is provided and 'localUrl' is true, add the file to the reply (attachment)
        if (localUrl && URL) {
            replyOptions.files = [new AttachmentBuilder(URL)]; // Attach the file if it's a local URL
        }

        // Send the reply with the prepared options
        await interaction.reply({ content: `<@${interaction.user.id}>` });
        await interaction.followUp(replyOptions);
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

export function returnCommandTimes(command : CommandInteraction) {
    const hours = (command.options.get('hours')?.value || 0) as number;
    const minutes = (command.options.get('minutes')?.value || 0) as number;
    const description = command.options.get('description')?.value;
    const total_ms = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    return { hours, minutes, description, total_ms };
}