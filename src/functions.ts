import {Message,TextChannel, ChannelType, VoiceChannel,GuildMember,User} from 'discord.js';
import { calculateTimeDifference } from './helperFunctionts';

export const handleStatusCommand = async (message: Message, tracker: Record<string, string>) => {
    const args = message.content.split(' ');
    const username = args[1];
    const CURRENT_TIME = new Date();
    const botUsername="BOT";

    // If the user provided "all", list all tracked users
    if (username === "all") {
        if (Object.keys(tracker).length === 0) {
            (message.channel as TextChannel).send("No users are currently being tracked.");
            return;
        }
        let allStatuses = "**Tracked Users' Offline Status:**\n";
        if (botUsername in tracker) {
            const botStartTime = new Date(tracker[botUsername]);
            const {days, hours, minutes, seconds} = calculateTimeDifference(botStartTime, CURRENT_TIME);
            allStatuses += `- **${botUsername}**: Started at ${botStartTime.toLocaleString()}, which was ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds ago.\n`;
        }
        // Loop through tracker and calculate offline times
        for (const [user, offlineTime] of Object.entries(tracker)) {
            if (user === botUsername)continue;
            const OFFLINE_TIME = new Date(offlineTime);
            const {days,hours,minutes,seconds}=calculateTimeDifference(OFFLINE_TIME,CURRENT_TIME);

            allStatuses += `- **${user}**: Offline for ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds.\n`;
        }

        // Send the compiled list
        (message.channel as TextChannel).send(allStatuses);
        return;
    }

    // If the username is not provided or invalid
    if (!username) {
        (message.channel as TextChannel).send("Please provide a username or use `!status all` to see all tracked users!");
        return;
    }

    // If the user is in the tracker (i.e., offline)
    if (username in tracker) {
        const OFFLINE_TIME = new Date(tracker[username]);
        const {days,hours,minutes,seconds}=calculateTimeDifference(OFFLINE_TIME,CURRENT_TIME);

        (message.channel as TextChannel).send(`${username} has been offline for ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`);
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
};

import { EmbedBuilder } from 'discord.js';

export const handleFeaturesCommand = async (message: Message) => {
    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Tang Sanzhang Features')
        .addFields(
            { name: '**!status [username]**', value: 'Check the online/offline status of a user.' },
            { name: '**!arena @username @username2**', value: 'Roll the dice against your opponents in the voice call.' },
            { name: '**!joinvc**', value: 'Make me join your current voice channel.' },
            { name: '**Reminders**', value: 'Receive periodic reminders.' }
        )
        .setFooter({ text: 'Bot created by Duke :)' });

    (message.channel as TextChannel).send({ embeds: [embed] });
};



export const handleArenaCommand = async (message: Message) => {
    // Non-null assertion for guild (only use in a guild context)
    const guild = message.guild!;
   
    // Get all mentioned users (convert Collection to array)
    const mentionedUsers = Array.from(message.mentions.users.values());
    if (mentionedUsers.length === 0) {
        return message.reply('Please mention at least one user to play the roulette with! Usage: !roulette @username1');
    }

    // Check if the caller is trying to include themselves
    if (mentionedUsers.some(user => user.id === message.author.id)) {
        return message.reply('You cannot play roulette with yourself!');
    }

    // Get GuildMember objects with proper type handling
    const senderMember = guild.members.cache.get(message.author.id);
    const defendingMembers = mentionedUsers
        .map((user: User) => guild.members.cache.get(user.id))
        .filter((member): member is GuildMember => member !== undefined);

    // Validate members exist and are in voice channels
    if (!senderMember) {
        return message.reply('Could not find the sender in the server.');
    }

    if (defendingMembers.length === 0) {
        return message.reply('Could not find the mentioned users in the server.');
    }

    // Null checks for voice channels
    if (!senderMember.voice?.channel) {
        return message.reply('You must be in a voice channel to play roulette!');
    }

    const senderVoiceChannelId = senderMember.voice.channel.id;

    // Check if all defending members are in the same voice channel
    const invalidDefenders = defendingMembers.filter(member => 
        !member.voice?.channel || member.voice.channel.id !== senderVoiceChannelId
    );

    if (invalidDefenders.length > 0) {
        return message.reply('All users must be in the SAME voice channel to play roulette!');
    }

    // Calculate total participants
    const allParticipants = [senderMember, ...defendingMembers];
    const totalParticipants = allParticipants.length;

    // Probability calculation:
    // 1/x chance ALL get kicked
    // (x-1)/x chance only original caller gets kicked
    const randomValue = Math.random();
    const targetChannel = guild.channels.cache.find(channel => 
        channel.name === "Ten Courts of Hell" && channel.type === ChannelType.GuildVoice
    );
    
    if (!targetChannel) {
        return message.reply("Could not find the target voice channel 'Ten Courts of Hell'.");
    }

    try {
        if (randomValue < 1 / totalParticipants) {
            // ALL participants get kicked
            const kickPromises = defendingMembers.map(member => 
                member.voice.setChannel(targetChannel as VoiceChannel)
            );

            await Promise.all(kickPromises);

            const affectedUsers = defendingMembers
                .map(member => member.user.username)
                .join(' and ');
            
            const resultMessage = `🎲 Roulette Result: ${affectedUsers} were ALL banished from the voice channel!`;
            (message.channel as TextChannel).send(resultMessage);
        } else {
            // Original caller gets kicked
            await senderMember.voice.setChannel(targetChannel as VoiceChannel);
            const resultMessage = `🎲 Roulette Result: ${senderMember.user.username} was banished from the voice channel!`;
            (message.channel as TextChannel).send(resultMessage);
        }
    } catch (error) {
        console.error('Error in roulette command:', error);
   
        // Provide a more informative error message
        let errorMessage = 'Failed to move the user(s) to the voice channel.';
        if (error instanceof Error) {
            if (error.message.includes('Missing Permissions')) {
                errorMessage = "I don't have permission to move users between voice channels.";
            } else if (error.message.includes('Invalid Voice Channel')) {
                errorMessage = "The target voice channel doesn't exist or is invalid.";
            }
        }
       
        (message.channel as TextChannel).send(errorMessage);
    }
}


import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';


export const handleJoinVCCommand = async (message: Message) => {
    // Error checking: Make sure the message is in a guild
    if (!message.guild) {
        return message.reply('This command can only be used in a server.');
    }

    // Get the member sending the command
    const member = message.guild.members.cache.get(message.author.id);

    // Check if the member is in a voice channel (null check for voice.channel)
    if (!member || !member.voice || !member.voice.channel) {
        return message.reply('You must be in a voice channel for me to join!');
    }

    try {
        // Join the user's current voice channel
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            // Use optional chaining to avoid errors if channel is null
            message.reply(`I have joined the **${member.voice.channel?.name ?? 'an unknown'}** voice channel!`);
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Bot got disconnected from the voice channel');
        });

    } catch (error) {
        console.error('Error in joining voice channel:', error);
        message.reply('There was an error while trying to join your voice channel.');
    }
};