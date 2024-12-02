import {ChannelType, TextChannel,PresenceStatus} from 'discord.js';
import {client, tracker, startBot, kill_week_old_entries, sendReminder} from './src/setup';
import * as FUNCTIONS from './src/functions'
import { sendEmbed } from './src/helperFunctionts';
import config from './src/config'
import 'dotenv/config';


client.once('ready', async () => {
    // Check if the bot can access the server (guild)
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        console.log(`(2) SERVER CONNECTION: SUCCESS - ${guild.name} (${guild.id})`);

        // Find the first text channel in the specific server
        const channel = guild.channels.cache.find(
            (channel): channel is TextChannel =>
                channel.type === ChannelType.GuildText
        );
        // put itself in tracker
        const currentTime = new Date().toISOString();
        tracker["BOT"]=currentTime;

        // put invisible users in the tracker
        const members = await guild.members.fetch();
        const correctMembers = members.filter((member) =>
            member.roles.cache.some((role) => config.requiredRoles.includes(role.name)) // Checks if the member has one of the required roles
        );
        correctMembers.forEach((member) => {
            // If the member does not have presence data (i.e., they're offline or not online yet)
            if (!member.presence) {
                // Get the current time and add the member to the tracker
                const currentTime = new Date().toISOString();
                tracker[member.user.username] = currentTime;
                console.log(`${member.user.username} is offline and has been added to the tracker.`);
            }
        });

        if (channel) {
            console.log("(3) CHANNEL CONNECTION: SUCCESS");
        } else {
            console.log("(3) No channel found to send initial message");
        }
    } catch (error) {
        console.error(`READY: ${error}`);
    }
});

const deletion_timers=new Map<string, NodeJS.Timeout>();
const addition_timers=new Map<string, NodeJS.Timeout>();
client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.user) {
        console.log("No presence update detected.");
        return;
    }

    const username = newPresence.user.username;
    const status = newPresence.status;

    const isOfflineStatus = (s: string): s is 'offline' => s === 'offline';

    const member = newPresence.guild?.members.cache.get(newPresence.user.id);

    if (!member || !member.roles.cache.some(role => config.requiredRoles.includes(role.name))) {
        // User does not have any of the required roles
        return;
    }

    if (isOfflineStatus(status)) {
        const currentTime = new Date().toISOString();
        // if entry already exists
        if (tracker[username]){
            const oldTime=tracker[username];
            const old_date=new Date(oldTime);
            const new_date=new Date(currentTime);
            const time_diff=new_date.getTime()-old_date.getTime();
            // if the difference is over an hour, keep the old one. Else, keep replacing so that you have the freshest start point
            if (time_diff>(1*60*60*1000)){
                return;
            }
            else {
                tracker[username]=currentTime;
            }
        }
        else {
            tracker[username]=currentTime;
        }
        // handle replacement if we deleted after we went offline
        if (addition_timers.has(username)){
            clearTimeout(addition_timers.get(username));
        }
        const timeout=setTimeout(()=>{
            if (tracker[username])return;
            tracker[username]=currentTime;
            addition_timers.delete(username);
        },config.GRACE_PERIOD)
        addition_timers.set(username,timeout);


        console.log(`${newPresence.user.username} has gone offline at ${currentTime}`);
    } else if (!isOfflineStatus(status) && tracker[username]) {
        // if they have been on already, skip
        if (deletion_timers.has(username)){
            return;
        }

        // add the timer for them to be knocked out the first time they come online
        const timeout=setTimeout(()=>{
            delete tracker[username];
            deletion_timers.delete(username);
        }, config.GRACE_PERIOD)
        deletion_timers.set(username,timeout);
    }
});



import {EmbedBuilder} from 'discord.js';

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !test (case-insensitive)
    if (message.content.toUpperCase() === '!TEST') {
        message.channel.send("TEST==TRUE");
    }

    // !status <@xyz> (case-insensitive)
    else if (message.content.toUpperCase().startsWith('!SLEEPCHECK')) {
        FUNCTIONS.handleStatusCommand(message, tracker);
    }

    // !features (case-insensitive)
    else if (message.content.toUpperCase() === '!FEATURES') {
        FUNCTIONS.handleFeaturesCommand(message);
    }

    // !arena (case-insensitive)
    else if (message.content.toUpperCase().startsWith('!ARENA')) {
        FUNCTIONS.handleArenaCommand(message);
    }

    // !joinvc (case-insensitive)
    else if (message.content.toUpperCase() === '!JOINVC') {
        FUNCTIONS.handleJoinVCCommand(message);
    }

    else if (message.content.toUpperCase().startsWith('!XYZ')) {
        const mentionedUser = message.mentions.users.first();
        
        if (!mentionedUser) {
            return message.channel.send('Please mention a user to impersonate!');
        }

        // Create the impersonation embed
        const impersonateEmbed = new EmbedBuilder()
            .setAuthor({
                name: `${mentionedUser.username}#${mentionedUser.discriminator}`,
                iconURL: mentionedUser.displayAvatarURL()
            })
            .setDescription('you give me c')
            .setColor('#3498db')  // You can choose any color you like
            .setTimestamp();

        // Send the impersonation message
        message.channel.send({ embeds: [impersonateEmbed] });
    }
    else if (message.content.toUpperCase().startsWith('!ATTACK')){
        FUNCTIONS.handleAttackCommand(message);
    }
    else if (message.content.toUpperCase()===('!FLIP')){
        FUNCTIONS.handleCoinFlipCommand(message);
    }
    else if (message.content.toUpperCase()===('!HANGMAN')){
        FUNCTIONS.handleHangman(message);
    } 
    // unknown input
    else if (message.content.startsWith('! ')){
        sendEmbed((message.channel as TextChannel),"??",`Unknown input: ${message.content}`)
    }
});




// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(kill_week_old_entries, 24 * 60 * 60 * 1000); 

setInterval(sendReminder, Math.floor((Math.random()*12)) * 60 * 60 * 1000);

