import { Interaction, EmbedBuilder, AttachmentBuilder, TextChannel,CommandInteraction, Message, User } from 'discord.js';
import {generate} from 'random-words'
import { interactionReply, selectMemberWithRequiredRoles, selectRandomServerMember, sendEmbed } from './helperFunctionts';
import config from './config';
import { client } from './setup';

export const handleCoinFlipInteraction=async(interaction:CommandInteraction)=>{
    const coinSides = ['Heads', 'Tails'];
    const result = coinSides[Math.floor(Math.random() * coinSides.length)];

    // Decide the images based on the result (Heads = Win, Tails = Lose)
    const heads_image = new AttachmentBuilder('./static/heads.JPG');  // Local path
    const tails_image = new AttachmentBuilder('./static/tails.JPG');  // Local path

    // Select the image based on the coin flip result
    const resultImage = result === 'Heads' ? heads_image : tails_image;
    const imageFileName = result === 'Heads' ? 'heads.JPG' : 'tails.JPG';

    // Create an embed for the result
    const embed = new EmbedBuilder()
        .setColor('#FFD700')  // Gold color for the coin flip
        .setTitle('Coin Flip Result')
        .setDescription(`The coin landed on **${result}**!`)
        .setImage(`attachment://${imageFileName}`);  // Dynamically set the image

    // Respond to the interaction
    await interaction.reply({
        embeds: [embed],
        files: [resultImage],
    });
}


export const handleHangmanInteraction = async (interaction:CommandInteraction, channel:TextChannel) => {
    const word = generate(); // Get a random word
    let hiddenWord = '_'.repeat(word.length);  // Set the initial hidden word (e.g., '____')
    let attempts = 0;
    let tries = 5;
    let guessedLetters: string[] = [];

    // Send a welcome message using sendEmbed, including the number of letters to guess
    const spacedHiddenWord = '`' + hiddenWord.split('').join(' ') + '`'; // Wrap the spaced hidden word in backticks
    sendEmbed(channel, null, 'Hangman Game Started', `The word has ${word.length} letters: ${spacedHiddenWord}`);

    // Start the message collector without filtering for a specific user
    const filter = (response: Message) => response.content.length === 1 && /^[a-z]$/i.test(response.content); // Only accept valid letter guesses
    const collector = channel.createMessageCollector({ filter, time: config.times.GAME_HANGMAN_GAMETIME });

    collector.on('collect', (response: Message) => {
        const guess = response.content.toLowerCase(); // Get the lowercase version of the guess

        // CHECK: already guessed
        if (guessedLetters.includes(guess)) {
            sendEmbed(channel, null, 'Duplicate Guess', `You already guessed the letter "${guess}".\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\`\nYou have ${tries} attempts remaining`);
            return; // Skip the rest of the code if the letter has been guessed already
        }

        guessedLetters.push(guess); // Add the guess to the list of guessed letters
        attempts++; // Increase the number of attempts made

        let updatedWord = '';

        // Update the hidden word with the correct guess
        for (let i = 0; i < word.length; i++) {
            updatedWord += word[i] === guess ? guess : hiddenWord[i];
        }

        hiddenWord = updatedWord; // Update the hidden word to show progress

        // Calculate the remaining letters (number of underscores in hiddenWord)
        const remainingLetters = hiddenWord.split('_').length - 1;

        let embedTitle = '';
        let embedDescription = '';
        let embedImage = '';

        // If the guess is incorrect, subtract from tries and inform the user
        if (!word.includes(guess)) {
            tries--;
            embedTitle = 'Incorrect Guess';
            embedDescription = `You guessed the letter "${guess}" wrong!\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\``;
        } else {
            // If the guess is correct, inform the user
            embedTitle = 'Correct Guess';
            embedDescription = `Good job! You guessed the letter "${guess}" correctly!\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\``;
        }

        // CHECK: NO TRIES LEFT
        if (tries === 0) {
            embedTitle = 'Game Over';
            embedDescription = `Poor wife and kids... You're out of guesses! The correct word was: \n${word}`;
            embedImage = './static/hangman_dead.JPG';
            collector.stop();
        }
        // CHECK: IF SUCCESS
        else if (hiddenWord === word) {
            embedTitle = 'Congratulations!';
            embedDescription = `You guessed the word: ${word} in ${attempts} attempts! Well Done!`;
            embedImage = './static/hangman_alive.JPG';
            collector.stop(); // Stop the game if the word is guessed
        } else {
            // CONTINUE
            const spacedHiddenWord = '`' + hiddenWord.split('').join(' ') + '`'; // Format hidden word with spaces and wrap in backticks
            embedDescription += `\n\nThere are ${remainingLetters} letters left to guess: \n${spacedHiddenWord}\nYou have ${tries} attempts remaining`;
            const invertedTries=6-tries;
            embedImage = `./static/hangman_${invertedTries}.JPG`;
        }

        // Send the embed with updated information
        sendEmbed(channel, embedImage, embedTitle, embedDescription);
    });

    // When the collector stops (time runs out or game is won), inform the players
    collector.on('end', () => {
        if (hiddenWord !== word && tries === 0) {
            sendEmbed(channel, './static/hangman_dead.JPG', 'Game Over', `You're out of guesses! The correct word was: ${word}`);
        } else if (hiddenWord !== word && tries > 0) {
            sendEmbed(channel, './static/hangman_dead.JPG', 'Game Over', `Time's up! The correct word was: ${word}`);
        }
    });
};

export const handleAttackInteraction = async (interaction: CommandInteraction): Promise<void> => {
    // Validate mentioned user
    const mentionedUser = interaction.options.get('target')!.user as User;
    if (!mentionedUser) {
        await interactionReply(interaction, null, 'Missing User', 'Please mention a user for this feature');
        return;
    }

    // Determine attack outcome
    const less_than_one_percent_chance = Math.floor(Math.random() * 101);

    if (less_than_one_percent_chance === 1) {
        // 1% chance: Random member with required roles
        const randomMemberOfRightRole = await selectMemberWithRequiredRoles();
        if (!randomMemberOfRightRole) {
            await interactionReply(interaction, null, 'Error', 'Failed to select a random member.');
            return;
        }
        await interactionReply(interaction,'./static/Zhu.webp', `${randomMemberOfRightRole.user.username}#${randomMemberOfRightRole.user.discriminator}`, 'you give me c');
    } else if (less_than_one_percent_chance === 0) {
        // 0% chance: Literally random person in server
        const randomMember = await selectRandomServerMember();
        if (!randomMember) {
            await interactionReply(interaction, null, 'Error', 'Failed to select a random member.');
            return;
        }
        await interactionReply(interaction,'./static/Zhu.webp', `${randomMember.user.username}#${randomMember.user.discriminator}`, 'you give me c');
    } else {
        // Regular hit on mentioned user
        await interactionReply(interaction,'./static/Zhu.webp', `${mentionedUser.username}#${mentionedUser.discriminator}`, `<@${mentionedUser.id}> gets hit!`);
    }
};

