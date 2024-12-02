/*
 * Copyright (C) 2024 Duksing Chau
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {Client, GatewayIntentBits,TextChannel,ChannelType} from 'discord.js'
import 'dotenv/config';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        
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