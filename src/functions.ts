import {Message,TextChannel, VoiceChannel} from 'discord.js';
import { calculateTimeDifference } from './helperFunctionts';

export const handleStatusCommand = async (message: Message, tracker: Record<string, string>) => {
    const args = message.content.split(' ');
    const username = args[1];
    const CURRENT_TIME = new Date();

    // If the user provided "all", list all tracked users
    if (username === "all") {
        if (Object.keys(tracker).length === 0) {
            (message.channel as TextChannel).send("No users are currently being tracked.");
            return;
        }

        let allStatuses = "**Tracked Users' Offline Status:**\n";

        // Loop through tracker and calculate offline times
        for (const [user, offlineTime] of Object.entries(tracker)) {
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
        .setTitle('communityBot Features')
        .addFields(
            { name: '**!status [username]**', value: 'Check the online/offline status of a user.' },
            { name: '**!roulette @username**', value: 'Play roulette with another user in the same voice channel.' },
            { name: '**!joinvc**', value: 'Make the bot join your current voice channel.' },
            { name: '**Reminders**', value: 'Receive periodic reminders.' }
        )
        .setFooter({ text: 'Bot created by Duke :)' });

    (message.channel as TextChannel).send({ embeds: [embed] });
};



export const handleRouletteCommand=async(message:Message)=>{
    // error checking
    if (!message.guild) {
        return message.reply('This command can only be used in a server.');
    }
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
        return message.reply('Please mention a user to play the roulette with! Usage: !roulette @username');
    }
    if (mentionedUser.id === message.author.id) {
        return message.reply('You cannot play roulette with yourself!');
    }

    // get GuildMember objects (voice channel status, roles, nicknames)
    const senderMember = message.guild.members.cache.get(message.author.id);
    const receiverMember = message.guild.members.cache.get(mentionedUser.id);

    // Validate both members exist
    if (!senderMember || !receiverMember) {
        return message.reply('Could not find one or both users in the server.');
    }

    // Check if both users are in a voice channel
    if (!senderMember.voice.channel || !receiverMember.voice.channel) {
        return message.reply('Both users must be in the same voice channel to play roulette!');
    }

    // Ensure both users are in the SAME voice channel
    if (senderMember.voice.channel.id !== receiverMember.voice.channel.id) {
        return message.reply('Both users must be in the SAME voice channel to play roulette!');
    }

    // Randomly choose between sender and receiver
    const participants = [
        { member: senderMember, name: message.author.username }, 
        { member: receiverMember, name: mentionedUser.username }
    ];
    const chosenOne = participants[Math.floor(Math.random() * participants.length)];

    // Announce the roulette result
    try {
        // Disconnect the chosen user from the voice channel
        const targetChannel = message.guild.channels.cache.find(channel => channel.name === "Ten Courts of Hell");
        if (!targetChannel) {
            return message.reply("Could not find the target voice channel 'Ten Courts of Hell'.");
        }
        await chosenOne.member.voice.setChannel(targetChannel as VoiceChannel);

        // Send a more detailed message
        const resultMessage = `🎲 Roulette Result: ${chosenOne.name} was banished from the voice channel!`;
        (message.channel as TextChannel).send(resultMessage);
    } catch (error) {
        console.error('Error in roulette command:', error);
    
        // Provide a more informative error message
        let errorMessage = 'Failed to move the user to the voice channel.';
        if (error instanceof Error) {
            // Check for specific error types
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