import {Client, GatewayIntentBits,TextChannel,ChannelType} from 'discord.js'
import 'dotenv/config';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ]
});

export const tracker:{[username:string]:string}={};

// Async function for login with error handling
export async function startBot() {
    try {
        if (!process.env.BOT_TOKEN) {
            throw new Error('Bot token is not defined in environment variables');
        }
        
        await client.login(process.env.BOT_TOKEN);
        console.log('(1) LOGIN: SUCCESS');
    } catch (error) {
        console.error('(1) LOGIN: FAIL-', error);
    }
}

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
                (ch) => ch.type === ChannelType.GuildText && ch.name === 'bigBrother'
            ) as TextChannel;

            if (channel) {
                await channel.send("<@yan240> Reminder to do one's racket :)");
            } else {
                console.log("bigBrother channel not found");
            }
        }
    } catch (error) {
        console.error("Error in sendReminder:", error);
    }
};