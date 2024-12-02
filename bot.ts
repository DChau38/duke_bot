import {ChannelType, TextChannel,PresenceStatus, CommandInteraction} from 'discord.js';
import {client, tracker, startBot} from './src/setup';
import * as FUNCTIONS_MSG from './src/features_msg';
import * as FUNCTIONS_BOT from './src/features_bot';
import * as HELPERFUNCTIONS_MSG from './src/helperFunctionts';
import config from './src/config'
import 'dotenv/config';


client.once('ready', async () => {
    // Check if the bot can access the server (guild)
    try {
        const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID as string);
        if (!guild) {
            console.error("Guild not found");
            return;
        }
        console.log(`(2) SERVER CONNECTION: SUCCESS - ${guild.name} (${guild.id})`);

        // Find the first text channel in the specific server
        if (!guild.channels) {
            console.error("Guild channels not found");
            return;
        }
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
            member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)) // Checks if the member has one of the required roles
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

    if (!member || !member.roles.cache.some(role => config.mis.requiredRoles.includes(role.name))) {
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
            if (time_diff>(config.times.SLEEPCHECK_CHECK_PERIOD)){
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
        },config.times.SLEEPCHECK_CHECK_PERIOD)
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
        }, config.times.SLEEPCHECK_CHECK_PERIOD)
        deletion_timers.set(username,timeout);
    }
});



import {EmbedBuilder} from 'discord.js';

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;

        // !test (case-insensitive)
        if (message.content.toUpperCase() === '!TEST') {
            message.channel.send("TEST==TRUE");
        }

        // !status <@xyz> (case-insensitive)
        else if (message.content.toUpperCase().startsWith('!SLEEPCHECK')) {
            FUNCTIONS_MSG.handleSleepCommand(message, tracker);
        }

        // !features (case-insensitive)
        else if (message.content.toUpperCase() === '!FEATURES') {
            FUNCTIONS_MSG.handleFeaturesCommand(message);
        }

        // !arena (case-insensitive)
        else if (message.content.toUpperCase().startsWith('!ARENA')) {
            FUNCTIONS_MSG.handleArenaCommand(message);
        }

        // !joinvc (case-insensitive)
        else if (message.content.toUpperCase() === '!JOINVC') {
            FUNCTIONS_MSG.handleJoinVCCommand(message);
        }

        // !xyz (case-insensitive) with mention
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

        // !attack (case-insensitive)
        else if (message.content.toUpperCase().startsWith('!ATTACK')) {
            FUNCTIONS_MSG.handleAttackCommand(message);
        }

        // !flip (case-insensitive)
        else if (message.content.toUpperCase() === '!FLIP') {
            FUNCTIONS_MSG.handleCoinFlipCommand(message);
        }

        // !hangman (case-insensitive)
        else if (message.content.toUpperCase() === '!HANGMAN') {
            FUNCTIONS_MSG.handleHangman(message);
        } 

        // Simulate an error with !error
        else if (message.content.toUpperCase().startsWith('!ERROR')) {
            throw new Error("Simulated error");
        }

        // unknown input
        else if (message.content.startsWith('!')) {
            HELPERFUNCTIONS_MSG.sendEmbed((message.channel as TextChannel), null, "??", `Unknown input: ${message.content}`);
        }
    } catch (error) {
        console.error('An error occurred:', error);
        (message.channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS_MSG.sendEmbed(message.channel as TextChannel, './static/dead_discord.GIF', "You fucked me", "Uhhhh I got to go. I'll be back soon!");
    }
});

client.on('interactionCreate',async(interaction)=>{
    if (!interaction.isCommand())return; // commands only
    const {commandName}=interaction;
    const commandInteraction=(interaction as CommandInteraction);

    if (commandName==='test'){
        await commandInteraction.reply('TEST===TRUE');
    }
    // /flip
    if (commandName==='coinflip'){
        await FUNCTIONS_BOT.handleCoinFlipCommand(commandInteraction);
    }

});

// network issue
client.on('disconnect', async () => {
    console.log('Bot disconnected from Discord.');

    // Send a message to a specific channel about the disconnection
    const channel = client.channels.cache.get(config.ids.BIGBROTHER);  // Replace with your actual channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        await HELPERFUNCTIONS_MSG.sendEmbed(channel as TextChannel, null, "...", "Uhhhh I got to go. I'll be back soon!");
    }
});

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS_MSG.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the error
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS_MSG.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the rejection
});


// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(HELPERFUNCTIONS_MSG.kill_week_old_entries, 24 * 60 * 60 * 1000); 

setInterval(HELPERFUNCTIONS_MSG.sendReminder, Math.floor((Math.random()*12)) * 60 * 60 * 1000);

