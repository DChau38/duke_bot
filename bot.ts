import {ChannelType, TextChannel,PresenceStatus, CommandInteraction} from 'discord.js';
import {client, tracker, startBot} from './src/setup';
import * as FUNCTIONS_MSG from './src/features_msg';
import * as FUNCTIONS_BOT from './src/features_bot';
import * as HELPERFUNCTIONS from './src/helperFunctionts';
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


        // put itself in tracker
        const currentTime = new Date().toISOString();
        tracker["BOT"]=currentTime;

        // put invisible users in the tracker
        const members = await guild.members.fetch();
        const correctMembers = members.filter((member) =>
            member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)) // Checks if the member has one of the required roles
        );
        correctMembers.forEach(async (member) => {
            if (!member.presence) {
                // Get the current time and add the member to the tracker
                const tracker_id=HELPERFUNCTIONS.getNicknameOrUsernameElseNull(member.guild,member.user.username) as string;
                const currentTime = new Date().toISOString();
                tracker[tracker_id] = currentTime;
                console.log(`${tracker_id} is offline and has been added to the tracker.`);
            }
        });

        // Find the first text channel in the specific server
        if (!guild.channels) {
            console.error("Guild channels not found");
            return;
        }
        const channel = guild.channels.cache.find(
            (channel): channel is TextChannel =>
                channel.type === ChannelType.GuildText
        );
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
client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.user) {
        console.log("No presence update detected.");
        return;
    }

    // type guard for type narrowing
    const isOfflineStatus = (s: string): s is 'offline' => s === 'offline';

    // variables
    const username = newPresence.user.username;
    const tracker_id=HELPERFUNCTIONS.getNicknameOrUsernameElseNull(newPresence.guild!,username) as string;
    const status = newPresence.status;
    const member = newPresence.guild?.members.cache.get(newPresence.user.id);

    // case: skip if member without the right roles
    if (!member || !member.roles.cache.some(role => config.mis.requiredRoles.includes(role.name))) {
        return;
    }

    if (isOfflineStatus(status)) {
        const currentTime = new Date().toISOString();
        // if entry already exists
        if (tracker[tracker_id]){
            const oldTime=tracker[tracker_id];
            const old_date=new Date(oldTime);
            const new_date=new Date(currentTime);
            const time_diff=new_date.getTime()-old_date.getTime();
            // if the difference is over an hour, keep the old one. Else, keep replacing so that you have the freshest start point
            if (time_diff>(config.times.SLEEPCHECK_CHECK_PERIOD)){
                return;
            }
            else {
                tracker[tracker_id]=currentTime;
            }
        }
        else {
            tracker[tracker_id]=currentTime;
        }
        // handle replacement if we deleted after we went offline
        if (addition_timers.has(tracker_id)){
            clearTimeout(addition_timers.get(tracker_id));
        }
        const timeout=setTimeout(()=>{
            if (tracker[tracker_id])return;
            tracker[tracker_id]=currentTime;
            addition_timers.delete(tracker_id);
        },config.times.SLEEPCHECK_CHECK_PERIOD)
        addition_timers.set(tracker_id,timeout);


        console.log(`${tracker_id} has gone offline at ${currentTime}`);
    } else if (!isOfflineStatus(status) && tracker[tracker_id]) {
        // if they have been on already, skip
        if (deletion_timers.has(tracker_id)){
            return;
        }

        // add the timer for them to be knocked out the first time they come online
        const timeout=setTimeout(()=>{
            delete tracker[tracker_id];
            deletion_timers.delete(tracker_id);
        }, config.times.SLEEPCHECK_CHECK_PERIOD)
        deletion_timers.set(tracker_id,timeout);
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
            HELPERFUNCTIONS.sendEmbed((message.channel as TextChannel), null, "??", `Unknown input: ${message.content}`);
        }
    } catch (error) {
        console.error('An error occurred:', error);
        (message.channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS.sendEmbed(message.channel as TextChannel, './static/dead_discord.GIF', "You fucked me", "Uhhhh I got to go. I'll be back soon!");
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isCommand()) return; // commands only
        const { commandName } = interaction;

        // arguments
        const commandInteraction = (interaction as CommandInteraction);
        const normalizedCommandName = commandName.toUpperCase();
        const channel = (commandInteraction.channel as TextChannel);

        // hang
        if (normalizedCommandName === 'TEST') {
            await FUNCTIONS_BOT.testFunction(commandInteraction);
        }
        // flip
        else if (normalizedCommandName === 'REPLY') {
            await HELPERFUNCTIONS.interactionReply(commandInteraction, './static/Zhu.webp', 'Attack Result', 'Bang! <@target> gets hit!');
        }
        // coinflip
        else if (normalizedCommandName === 'COINFLIP') {
            await FUNCTIONS_BOT.handleCoinFlipInteraction(commandInteraction);
        }
        // hangman
        else if (normalizedCommandName === 'HANGMAN') {
            await FUNCTIONS_BOT.handleHangmanInteraction(commandInteraction, channel);
        }
        else if (normalizedCommandName === 'ATTACK') {
            await FUNCTIONS_BOT.handleAttackInteraction(commandInteraction);
        }
        else if (normalizedCommandName === 'SLEEP'){
            await FUNCTIONS_BOT.handleSleepInteraction(commandInteraction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});


// network issue
client.on('disconnect', async () => {
    console.log('Bot disconnected from Discord.');

    // Send a message to a specific channel about the disconnection
    const channel = client.channels.cache.get(config.ids.BIGBROTHER);  // Replace with your actual channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        await HELPERFUNCTIONS.sendEmbed(channel as TextChannel, null, "...", "Uhhhh I got to go. I'll be back soon!");
    }
});

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the error
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the rejection
});


// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(HELPERFUNCTIONS.kill_week_old_entries, 24 * 60 * 60 * 1000); 

setInterval(HELPERFUNCTIONS.sendReminder, Math.floor((Math.random()*12)) * 60 * 60 * 1000);



