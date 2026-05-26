const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    PermissionsBitField
} = require('discord.js');

const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');

require('dotenv').config();

// ============================================
// CLIENT
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ============================================
// BOT ONLINE
// ============================================

client.once('clientReady', () => {

    console.log(`${client.user.tag} is online!`);
});

// ============================================
// JOIN DM SYSTEM
// ============================================

client.on('guildMemberAdd', async (member) => {

    try {

        const joinEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('👋 Welcome to Prex Optimization')
            .setDescription(
`Hey ${member.user},

Welcome to **Prex Optimization** 🚀

We are very happy to have you as a part of our community.  
This server is specially made for gamers, optimization users, and members who want the best performance, support, and exclusive content.

━━━━━━━━━━━━━━━━━━

📌 Please complete the verification process to unlock all server channels and features.

📌 Make sure to read all rules carefully to avoid any issues.

📌 Stay active and respectful with all members and staff.

━━━━━━━━━━━━━━━━━━

💙 Thank you for joining and supporting Prex Optimization.

We hope you enjoy your stay and become an important part of our growing community 🚀`
            )
            .setThumbnail(member.user.displayAvatarURL({
                dynamic: true
            }))
            .setFooter({
                text: 'Prex Optimization'
            })
            .setTimestamp();

        await member.send({
            embeds: [joinEmbed]
        });

    } catch (err) {

        console.log('User DMs are closed.');
    }
});

// ============================================
// VERIFY PANEL COMMAND
// ============================================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (
        message.content === '!verifypanel' &&
        message.channel.id === process.env.VERIFY_CHANNEL_ID
    ) {

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔐 Verification Required')
            .setDescription(
                'Click the button below to verify yourself and unlock all channels.'
            )
            .setFooter({
                text: 'Prex Optimization'
            })
            .setTimestamp();

        const verifyButton = new ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(verifyButton);

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        await message.delete().catch(() => {});
    }
});

// ============================================
// VERIFY BUTTON SYSTEM
// ============================================

client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId === 'verify') {

        try {

            const verifiedRole =
                interaction.guild.roles.cache.get(
                    process.env.VERIFY_ROLE_ID
                );

            const memberRole =
                interaction.guild.roles.cache.get(
                    process.env.MEMBER_ROLE_ID
                );

            await interaction.member.roles.add([
                verifiedRole,
                memberRole
            ]);

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('Welcome to Prex Optimization !!')
                .setDescription(
                    `Hey ${interaction.user}, Thanks for Verifying !!`
                )
                .addFields(
                    {
                        name: '👥 Member Count',
                        value: `${interaction.guild.memberCount}`,
                        inline: false
                    },
                    {
                        name: '🆔 User ID',
                        value: `${interaction.user.id}`,
                        inline: false
                    }
                )
                .setThumbnail(
                    interaction.user.displayAvatarURL({
                        dynamic: true
                    })
                )
                .setFooter({
                    text: 'Prex Optimization'
                })
                .setTimestamp();

            const welcomeChannel =
                interaction.guild.channels.cache.get(
                    process.env.WELCOME_CHANNEL_ID
                );

            if (welcomeChannel) {

                await welcomeChannel.send({
                    embeds: [welcomeEmbed]
                });
            }

            await interaction.reply({
                content: '✅ You are now verified!',
                ephemeral: true
            });

            // ============================================
            // VERIFY DM
            // ============================================

            try {

                const verifyEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('✅ Verification Successful')
                    .setDescription(
`Hey ${interaction.user},

Congratulations 🎉

Your verification has been completed successfully and you now have full access to the server.

━━━━━━━━━━━━━━━━━━

🔓 You can now access all available channels.

💬 Feel free to chat with members and explore the community.

📢 Stay updated with announcements, updates, and exclusive content.

━━━━━━━━━━━━━━━━━━

Thank you for verifying and becoming a trusted member of **Prex Optimization** 💙

We hope you enjoy your experience with us 🚀`
                    )
                    .setThumbnail(
                        interaction.user.displayAvatarURL({
                            dynamic: true
                        })
                    )
                    .setFooter({
                        text: 'Prex Optimization'
                    })
                    .setTimestamp();

                await interaction.user.send({
                    embeds: [verifyEmbed]
                });

            } catch (err) {

                console.log('User DMs are closed.');
            }

        } catch (err) {

            console.error(err);

            await interaction.reply({
                content: '❌ Verification failed.',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// ============================================
// SUBSCRIBER PROOF SYSTEM
// ============================================

client.on('messageCreate', async (message) => {

    try {

        if (message.author.bot) return;

        if (
            message.channel.id !==
            process.env.PROOF_CHANNEL_ID
        ) return;

        if (!message.attachments.size) return;

        const attachment =
            message.attachments.first();

        const fileName =
            `proof-${message.author.id}.png`;

        const processedFile =
            `processed-${message.author.id}.png`;

        // ============================================
        // DOWNLOAD IMAGE
        // ============================================

        const response = await axios({
            url: attachment.url,
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(
            fileName,
            response.data
        );

        // ============================================
        // IMPROVE IMAGE FOR OCR
        // ============================================

        await sharp(fileName)
            .resize(2000)
            .grayscale()
            .normalize()
            .sharpen()
            .toFile(processedFile);

        // ============================================
        // OCR
        // ============================================

        const result =
            await Tesseract.recognize(
                processedFile,
                'eng'
            );

        const cleanText =
            result.data.text.toLowerCase();

        console.log(cleanText);

        // ============================================
        // VALID CHECK
        // ============================================

        const hasPrex =
            cleanText.includes('prex');

        const hasOptimization =
            cleanText.includes('optimization') ||
            cleanText.includes('opt');

        const hasSubscribed =
            cleanText.includes('subscribed');

        const hasSubscribeButton =
            cleanText.includes('subscribe') &&
            !cleanText.includes('subscribed');

        const valid =
            hasPrex &&
            hasOptimization &&
            hasSubscribed &&
            !hasSubscribeButton;

        console.log({
            hasPrex,
            hasOptimization,
            hasSubscribed,
            hasSubscribeButton,
            valid
        });

        // ============================================
        // SUCCESS
        // ============================================

        if (valid === true) {

            const role =
                message.guild.roles.cache.get(
                    process.env.SUBSCRIBER_ROLE_ID
                );

            if (role) {

                await message.member.roles.add(role);
            }

            // ============================================
            // SUBSCRIBER DM
            // ============================================

            try {

                const subEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🎉 Subscriber Verification Successful')
                    .setDescription(
`Hey ${message.author},

Thank you for subscribing to **Prex Optimization** 💙

Your subscription proof has been verified successfully and you have now received access to subscriber-only benefits and channels.

━━━━━━━━━━━━━━━━━━

✅ Subscriber role has been added successfully.

🔓 You can now access exclusive content and features.

📢 Stay tuned for future updates, releases, and premium resources.

━━━━━━━━━━━━━━━━━━

We truly appreciate your support and thank you for being a valuable part of the Prex Optimization community 🚀`
                    )
                    .setThumbnail(
                        message.author.displayAvatarURL({
                            dynamic: true
                        })
                    )
                    .setFooter({
                        text: 'Prex Optimization'
                    })
                    .setTimestamp();

                await message.author.send({
                    embeds: [subEmbed]
                });

            } catch (err) {

                console.log('User DMs are closed.');
            }

            // SUCCESS MESSAGE

            const successMsg =
                await message.channel.send({
                    content:
                    '✅ You have been verified and given access to Free Access.'
                });

            // FETCH MESSAGES

            const messages =
                await message.channel.messages.fetch({
                    limit: 100
                });

            const userMessages =
                messages.filter(
                    msg =>
                        msg.author.id ===
                        message.author.id
                );

            // DELETE USER MESSAGES

            for (
                const msg
                of userMessages.values()
            ) {

                await msg.delete()
                    .catch(() => {});
            }

            // DELETE SUCCESS MESSAGE

            setTimeout(async () => {

                await successMsg.delete()
                    .catch(() => {});

            }, 10000);
        }

        // ============================================
        // FAIL
        // ============================================

        else {

            const failMsg =
                await message.channel.send({
                    content:
                    '❌ Invalid proof. Timeout for 5 minutes.'
                });

            await message.member.timeout(
                5 * 60 * 1000,
                'Fake proof'
            ).catch(() => {});

            setTimeout(async () => {

                await failMsg.delete()
                    .catch(() => {});

            }, 10000);

            setTimeout(async () => {

                const messages =
                    await message.channel.messages.fetch({
                        limit: 100
                    });

                const userMessages =
                    messages.filter(
                        msg =>
                            msg.author.id ===
                            message.author.id
                    );

                for (
                    const msg
                    of userMessages.values()
                ) {

                    await msg.delete()
                        .catch(() => {});
                }

            }, 3000);
        }

        // ============================================
        // DELETE TEMP FILES
        // ============================================

        if (
            fs.existsSync(fileName)
        ) {

            fs.unlinkSync(fileName);
        }

        if (
            fs.existsSync(processedFile)
        ) {

            fs.unlinkSync(processedFile);
        }

    } catch (err) {

        console.log(err);
    }
});

// ============================================
// CUSTOM EMBED SYSTEM
// ============================================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // ============================================
    // SIMPLE EMBED
    // ============================================

    if (message.content.startsWith('!embed')) {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {

            return message.reply({
                content:
                '❌ You need Administrator permission.'
            });
        }

        const args =
            message.content.slice(7).trim();

        if (!args) {

            return message.reply({
                content:
                '❌ Usage: !embed Your message'
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📢 Prex Optimization')
            .setDescription(args)
            .setFooter({
                text: 'Prex Optimization'
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        await message.delete()
            .catch(() => {});
    }

    // ============================================
    // ANNOUNCEMENT EMBED
    // ============================================

    if (message.content.startsWith('!announce')) {

        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {

            return message.reply({
                content:
                '❌ You need Administrator permission.'
            });
        }

        const args =
            message.content.slice(10).trim();

        if (!args) {

            return message.reply({
                content:
                '❌ Usage: !announce Your announcement'
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚨 Important Announcement')
            .setDescription(args)
            .setFooter({
                text: 'Prex Optimization'
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        await message.delete()
            .catch(() => {});
    }
});

// ============================================
// PREVENT BOT CRASH
// ============================================

process.on(
    'unhandledRejection',
    (err) => {

        console.error(
            'Unhandled Promise Rejection:',
            err
        );
    }
);

process.on(
    'uncaughtException',
    (err) => {

        console.error(
            'Uncaught Exception:',
            err
        );
    }
);

// ============================================
// LOGIN
// ============================================

client.login(process.env.TOKEN);