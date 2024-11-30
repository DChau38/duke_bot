import {Message,TextChannel} from 'discord.js';


export const handleStatusCommand=async(message:Message,tracker:Record<string,string>)=>{
    const args = message.content.split(' ');
    const username = args[1];

    if (!username) {
        (message.channel as TextChannel).send("Please add a username!");
        return;
    }

    // If the user is in the tracker (i.e., offline)
    if (username in tracker) {
        const OFFLINE_TIME = new Date(tracker[username]);
        const CURRENT_TIME = new Date();
        const TIME_DIFF = CURRENT_TIME.getTime() - OFFLINE_TIME.getTime();

        // Format and send the offline time
        const days = Math.floor(TIME_DIFF / (1000 * 60 * 60 * 24));
        const hours = Math.floor((TIME_DIFF % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((TIME_DIFF % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((TIME_DIFF % (1000 * 60)) / 1000);
        const milliseconds = TIME_DIFF % 1000;

        (message.channel as TextChannel).send(`${username} has been offline for ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds, and ${milliseconds} milliseconds.`);
    } else {
        // Check if the user is currently online (presence)
        const guild = message.guild;
        if (!guild) {
            (message.channel as TextChannel).send("Could not find the server.");
            return;
        }

        const member = guild.members.cache.find((member) => member.user.username === username);

        if (!member) {
            (message.channel as TextChannel).send(`${username} not found in the server.`);
            return;
        }

        const presence = member.presence;
        if (presence && presence.status !== 'offline') {
            (message.channel as TextChannel).send(`${username} is online!`);
        } else {
            (message.channel as TextChannel).send(`${username} is not in the database and also not currently online.`);
        }
    }
}