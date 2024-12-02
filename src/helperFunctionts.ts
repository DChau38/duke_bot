import { EmbedBuilder, AttachmentBuilder, TextChannel, ChannelType } from 'discord.js';
import { client, tracker } from './setup';

export const calculateTimeDifference = (startTime: Date, endTime: Date) => {
    const timeDiff = endTime.getTime() - startTime.getTime();

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
};

export const sendEmbed = async (channel: TextChannel, URL: string|null, title: string, description: string) => {
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
        if (URL) await channel.send({ embeds: [embed], files:[attachment] });
        else await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending embed:', error);
    }
};

export function kill_week_old_entries() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    for (const userId in tracker) {
        const offlineTime = new Date(tracker[userId]);
        const timeDiff = new Date().getTime() - offlineTime.getTime();
        if (timeDiff > oneWeek) {
            delete tracker[userId];
            console.log(`${userId} has been removed from the tracker as they were offline for over a week.`);
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
                const member=guild.members.cache.find((mem)=>mem.user.username==='yan240')
                await channel.send(`<@${member?.user.id}> Reminder to do one's racket :)`);
            } else {
                console.log("aaa channel not found");
            }
        }
    } catch (error) {
        console.error("Error in sendReminder:", error);
    }
};