import {Message,TextChannel, ChannelType, VoiceChannel,GuildMember,User, EmbedBuilder, AttachmentBuilder, Guild} from 'discord.js';
import { calculateTimeDifference, sendEmbed } from './helperFunctionts';
import {client} from './setup'
import config from './config';

// common variables
const TIME_THRESHOLD = 1000;

export const handleStatusCommand = async (message: Message, tracker: Record<string, string>) => {
    const args = message.content.split(' ');
    const username = args[1];
    const CURRENT_TIME = new Date();
    const botUsername = "BOT";

    // If the username is not provided or invalid
    if (!username) {
        return sendEmbed(message.channel as TextChannel, 'Invalid Command', 'Please provide a username or use `!sleepcheck all` to see all tracked users!');
    }
    // If the user provided "all", list all tracked users
    if (username.toLowerCase() === "all") {
        if (Object.keys(tracker).length === 0) {
            return sendEmbed(message.channel as TextChannel, 'No Users Tracked', 'No users are currently being tracked.');        
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle("Tracked Users' Offline Status")
            .setDescription("Here are the statuses of all tracked users:");

        if (botUsername in tracker) {
            const botStartTime = new Date(tracker[botUsername]);
            const { days, hours, minutes, seconds } = calculateTimeDifference(botStartTime, CURRENT_TIME);
            embed.addFields({
                name: `**${botUsername}**`,
                value: `Started at ${botStartTime.toLocaleString()}, which was ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds ago.`,
            });
        }

        // Loop through tracker and calculate offline times
        for (const [user, offlineTime] of Object.entries(tracker)) {
            if (user === botUsername) continue;
            const OFFLINE_TIME = new Date(offlineTime);
            const { days, hours, minutes, seconds } = calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);
            const member = message.guild?.members.cache.get(user);
            const nickname = member?.nickname || user; // Fallback to username if no nickname

            if (Math.abs(OFFLINE_TIME.getTime() - new Date(tracker[botUsername]).getTime()) <= TIME_THRESHOLD) {
                embed.addFields({
                    name: `**${nickname}**`,
                    value: `(UNKNOWN) OFFLINE SINCE BOT STARTED`,
                });
            } else {
                embed.addFields({
                    name: `**${nickname}**`,
                    value: `Offline for ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`,
                });
            }
        }

        // Send the embed
        (message.channel as TextChannel).send({ embeds: [embed] });

        return;
    } else 
    // If the user is in the tracker (i.e., offline)
    if (username in tracker) {
        const OFFLINE_TIME = new Date(tracker[username]);
        const { days, hours, minutes, seconds } = calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`${username}'s Status`)
            .setDescription(`${username} has been offline for ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`)
            .setThumbnail(message.guild?.members.cache.get(username)?.user.avatarURL() || '');

        (message.channel as TextChannel).send({ embeds: [embed] });
    } else {
        // Check if the user is currently online (presence)
        const guild = message.guild;
        if (!guild) {
            return sendEmbed(message.channel as TextChannel, 'Error', "Could not find the server.");
        }

        const member = guild.members.cache.find((member) => member.user.username === username);

        if (!member) {
            return sendEmbed(message.channel as TextChannel, 'User Not Found', `${username} not found in the server.`);
        }

        const presence = member.presence;
        if (presence && presence.status !== 'offline') {
            return sendEmbed(message.channel as TextChannel, 'User Status', `${username} is online!`);
        } else {
            return sendEmbed(message.channel as TextChannel, 'User Status', `${username} is not in the database and also not currently online.`);        }
    }
};


export const handleFeaturesCommand = async (message: Message) => {
    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Tang Sanzhang Features')
        .addFields(
            { name: '**!sleepCheck [username]**', value: 'Check how long you slept. Upon waking up and logging on, you have 15m to check the time difference.' },
            { name: '**!arena @username @username2 ...**', value: 'Roll the dice against your opponents in the voice call.' },
            { name: '**!joinvc**', value: 'Make me join your current voice channel.' },
            { name: '**!attack @username**', value: 'Send your favorite friend a happy image'},
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
        return sendEmbed(message.channel as TextChannel, 'No Users Mentioned', 'Please mention at least one user to play the roulette with! Usage: !roulette @username1');    }

    // Check if the caller is trying to include themselves
    if (mentionedUsers.some(user => user.id === message.author.id)) {
        return sendEmbed(message.channel as TextChannel, 'Self-Play Not Allowed', 'You cannot play roulette with yourself!');    }

    // Get GuildMember objects with proper type handling
    const senderMember = guild.members.cache.get(message.author.id);
    const defendingMembers = mentionedUsers
        .map((user: User) => guild.members.cache.get(user.id))
        .filter((member): member is GuildMember => member !== undefined);

    // Validate members exist and are in voice channels
    if (!senderMember) {
        return sendEmbed(message.channel as TextChannel, 'Sender Not Found', 'Could not find the sender in the server.');    
    }

    if (defendingMembers.length === 0) {
        return sendEmbed(message.channel as TextChannel, 'Defenders Not Found', 'Could not find the mentioned users in the server.');    
    }

    // Null checks for voice channels
    if (!senderMember.voice?.channel) {
        return sendEmbed(message.channel as TextChannel, 'Not in Voice Channel', 'You must be in a voice channel to play roulette!');
    }

    const senderVoiceChannelId = senderMember.voice.channel.id;

    // Check if all defending members are in the same voice channel
    const invalidDefenders = defendingMembers.filter(member => 
        !member.voice?.channel || member.voice.channel.id !== senderVoiceChannelId
    );

    if (invalidDefenders.length > 0) {
        return sendEmbed(message.channel as TextChannel, 'Voice Channel Mismatch', 'All users must be in the SAME voice channel to play roulette!');    
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
        return sendEmbed(message.channel as TextChannel, 'Channel Not Found', "Could not find the target voice channel 'Ten Courts of Hell'.");    
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
            
                return sendEmbed(message.channel as TextChannel, 'Roulette Result', `🎲 Roulette Result: ${affectedUsers} were ALL banished from the voice channel!`);
        } else {
            // Original caller gets kicked
            await senderMember.voice.setChannel(targetChannel as VoiceChannel);
            return sendEmbed(message.channel as TextChannel, 'Roulette Result', `🎲 Roulette Result: ${senderMember.user.username} was banished from the voice channel!`);
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
       
        return sendEmbed(message.channel as TextChannel, 'Error', errorMessage);    }
}


import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';


export const handleJoinVCCommand = async (message: Message) => {
    // Error checking: Make sure the message is in a guild
    if (!message.guild) {
        return sendEmbed(message.channel as TextChannel, 'Not a Guild', 'This command can only be used in a server.');    
    }

    // Get the member sending the command
    const member = message.guild.members.cache.get(message.author.id);

    // Check if the member is in a voice channel (null check for voice.channel)
    if (!member || !member.voice || !member.voice.channel) {
        return sendEmbed(message.channel as TextChannel, 'Not in Voice Channel', 'You must be in a voice channel for me to join!');    
    }

    try {
        // Join the user's current voice channel
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

    } catch (error) {
        console.error('Error in joining voice channel:', error);
        message.reply('There was an error while trying to join your voice channel.');
    }
};

export const handleAttackCommand=async(message:Message)=>{
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
        return sendEmbed(message.channel as TextChannel,'Missing User', 'Please add a user for this feature');
    }

    // make embed
    const embed = new EmbedBuilder()
    .setDescription('you give me c')
    .setColor('#3498db');

    // calculate chance for miss
    const one_percent_chance=Math.floor(Math.random()*100);
    let current_userid;
    // if 1/101 => person in roles
    if (one_percent_chance===1){
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string)
        const members = await guild.members.fetch();
        // random person from roles
        const correctMembers = members.filter((member) =>
            member.roles.cache.some((role) => config.requiredRoles.includes(role.name)) // Checks if the member has one of the required roles
        );

        const randomMember = correctMembers.random(); // .random() gives you a random element from a collection
        if (!randomMember) {
            return sendEmbed(message.channel as TextChannel, 'Error', 'Failed to select a random member.');
        }
        embed.setAuthor({
            name: `${randomMember.user.username}#${randomMember.user.discriminator}`,
            iconURL: randomMember.user.displayAvatarURL(),
        });
        embed.addFields({
            name: '...',
            value: `huh? <@${randomMember.user.id}>`,
        });
        current_userid=randomMember.user.id;
        
    }
    // if 0/101 => literally random person
    else if (one_percent_chance===0){
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string)
        const members = await guild.members.fetch();
        // literally random person in server
        const randomMember = members.random(); 
        if (!randomMember) {
            return sendEmbed(message.channel as TextChannel, 'Error', 'Failed to select a random member.');
        }
        embed.setAuthor({
            name: `${randomMember.user.username}#${randomMember.user.discriminator}`,
            iconURL: randomMember.user.displayAvatarURL(),
        });
        embed.addFields({
            name: '...',
            value: `huh? <@${randomMember.user.id}>`,
        });
        current_userid=randomMember.user.id;
    } 
    // regular hit
    else {
        embed.setAuthor({
            name: `${mentionedUser.username}#${mentionedUser.discriminator}`,
            iconURL: mentionedUser.displayAvatarURL(),
        });
        embed.addFields({
            name: 'Bang!',
            value: `<@${mentionedUser.id}> gets hit!`,
        });
        current_userid=mentionedUser.id;


    }

    //attach image + send image
    const attachment=new AttachmentBuilder('./src/Zhu.webp');
    embed.setImage('attachment://Zhu.webp');
    (message.channel as TextChannel).send(`<@${current_userid}>`);
    (message.channel as TextChannel).send({embeds:[embed],files:[attachment]});


}