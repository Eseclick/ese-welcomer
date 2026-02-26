import { api, opendiscord, utilities } from "#opendiscord"
import * as discord from "discord.js"

if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

// 1. TYPE DEFINITIONS
export interface ESEWelcomerConfig {
    welcomeChannelId: string;
    testTitle: string; 
    messageContent: string;
    embed: {
        color: string;
        title: string;
        description: string;
        footer: string;
        thumbnail: string;
        image: string;
        timestamp: boolean;
        author: {
            name: string;
            icon: string;
            url: string;
        }
    }
}

export class ESEWelcomerJsonConfig extends api.ODJsonConfig {
    declare data: ESEWelcomerConfig
}

// 2. DECLARATIONS
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ese-welcomer": api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ese-welcomer:config": ESEWelcomerJsonConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ese-welcomer:config": api.ODChecker
    }
    export interface ODSlashCommandManagerIds_Default {
        "ese-welcomer:command": api.ODSlashCommand
    }
    export interface ODMessageManagerIds_Default {
        "ese-welcomer:success-message": { source: "slash" | "other", params: { configData: ESEWelcomerConfig, member: discord.GuildMember }, workers: "ese-welcomer:success-message" }
        "ese-welcomer:reload-message": { source: "slash", params: { success: boolean }, workers: "ese-welcomer:reload-message" }
    }
    export interface ODEmbedManagerIds_Default {
        "ese-welcomer:success-embed": { source: "slash" | "other", params: { configData: ESEWelcomerConfig, member: discord.GuildMember }, workers: "ese-welcomer:success-embed" }
    }
}

// 3. REGISTER CONFIG & CHECKER
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new ESEWelcomerJsonConfig("ese-welcomer:config", "config.json", "./plugins/ese-welcomer/"))
})

export const welcomerConfigStructure = new api.ODCheckerObjectStructure("ese-welcomer:config", {
    children: [
        { key: "welcomeChannelId", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:channel-id", { minLength: 15 }) },
        { key: "testTitle", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:test-title", { maxLength: 200 }) },
        { key: "messageContent", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:content", { maxLength: 2000 }) },
        {
            key: "embed", optional: false, priority: 0, checker: new api.ODCheckerObjectStructure("ese-welcomer:embed", {
                children: [
                    { key: "author", optional: false, priority: 0, checker: new api.ODCheckerObjectStructure("ese-welcomer:author", {
                        children: [
                            { key: "name", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:author-name", { maxLength: 256 }) },
                            { key: "icon", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:author-icon", {}) },
                            { key: "url", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:author-url", {}) }
                        ]
                    }) },
                    { key: "title", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:title", { maxLength: 256 }) },
                    { key: "description", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:desc", { maxLength: 4096 }) },
                    { key: "color", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:color", { maxLength: 7 }) },
                    { key: "thumbnail", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:thumb", {}) },
                    { key: "image", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:image", {}) },
                    { key: "footer", optional: false, priority: 0, checker: new api.ODCheckerStringStructure("ese-welcomer:footer", { maxLength: 2048 }) },
                    { key: "timestamp", optional: false, priority: 0, checker: new api.ODCheckerBooleanStructure("ese-welcomer:timestamp", {}) }
                ]
            })
        }
    ]
})

opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const config = opendiscord.configs.get("ese-welcomer:config")
    checkers.add(new api.ODChecker("ese-welcomer:config", checkers.storage, 0, config, welcomerConfigStructure))
})

// 4. UTILITY FUNCTIONS
const getThumbnailUrl = (member: discord.GuildMember, configThumb: string): string | undefined => {
    if (configThumb.toLowerCase() === "user-icon") {
        return member.user.displayAvatarURL({ size: 512 });
    }
    return configThumb.startsWith("http") ? configThumb : undefined;
}

// 5. REGISTER SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ese-welcomer:command", {
        name: "welcome",
        description: "Manage welcome messages",
        type: discord.ApplicationCommandType.ChatInput,
        contexts: [discord.InteractionContextType.Guild],
        integrationTypes: [discord.ApplicationIntegrationType.GuildInstall],
        options: [
            {
                type: discord.ApplicationCommandOptionType.Subcommand,
                name: "test",
                description: "Test the welcome message"
            },
            {
                type: discord.ApplicationCommandOptionType.Subcommand,
                name: "reload",
                description: "Reload the configuration from file"
            }
        ]
    }))
})

// 6. REGISTER BUILDERS
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ese-welcomer:success-embed"))
    embeds.get("ese-welcomer:success-embed").workers.add(
        new api.ODWorker("ese-welcomer:success-embed", 0, (instance, params, source, cancel) => {
            const { configData, member } = params;
            const data = configData.embed;

            if (data.author.name) {
                instance.setAuthor(
                    data.author.name.replace("{user}", member.displayName).replace("{server}", member.guild.name),
                    data.author.icon.startsWith("http") ? data.author.icon : undefined,
                    data.author.url.startsWith("http") ? data.author.url : undefined
                )
            }

            instance.setTitle((data.title || "Welcome!").replace("{server}", member.guild.name))
            instance.setDescription((data.description || "")
                .replace("{user}", member.toString())
                .replace("{server}", member.guild.name)
            )
            instance.setColor((data.color as any) || "#ff8c00")
            
            if (data.footer) instance.setFooter(data.footer.replace("{server}", member.guild.name))
            
            const thumb = getThumbnailUrl(member, data.thumbnail);
            if (thumb) instance.setThumbnail(thumb);

            if (data.image?.startsWith("http")) instance.setImage(data.image)
            if (data.timestamp) instance.setTimestamp(new Date())
        })
    )
})

opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ese-welcomer:success-message"))
    messages.get("ese-welcomer:success-message").workers.add(
        new api.ODWorker("ese-welcomer:success-message", 0, async (instance, params, source, cancel) => {
            const { configData, member } = params;
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ese-welcomer:success-embed").build(source, params))
            
            const fullContent = `${configData.testTitle}${configData.messageContent || ""}`;
            instance.setContent(fullContent
                .replace("{user}", member.toString())
                .replace("{server}", member.guild.name)
            )
            if (source === "slash") instance.setEphemeral(true)
        })
    )

    messages.add(new api.ODMessage("ese-welcomer:reload-message"))
    messages.get("ese-welcomer:reload-message").workers.add(
        new api.ODWorker("ese-welcomer:reload-message", 0, async (instance, params, source, cancel) => {
            instance.setContent(params.success ? "✅ **ESE-Welcomer configuration successfully reloaded!**" : "❌ **An error occurred while reloading.** Check the console.")
            if (source === "slash") instance.setEphemeral(true)
        })
    )
})

// 7. COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")
    const responder = new api.ODCommandResponder("ese-welcomer:responder", generalConfig.data.prefix, "welcome")
    commands.add(responder)

    responder.workers.add([
        new api.ODWorker("ese-welcomer:worker", 0, async (instance, params, source, cancel) => {
            if (source !== "slash") return;
            const scope = instance.options.getSubCommand();

            const { guild, channel, user } = instance
            const perms = await opendiscord.permissions.getPermissions(user, channel, guild!);
            
            if (!opendiscord.permissions.hasPermissions("admin", perms)) {
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build(source, { guild: guild!, channel, user, permissions: ["admin"] }))
                return cancel()
            }

            // Define the purple log prefix and formatted user
            const purplePlugin = "\x1b[35m[PLUGIN]\x1b[0m";
            const formattedUser = user.username.charAt(0).toUpperCase() + user.username.slice(1);

            if (scope === "test") {
                const config = opendiscord.configs.get("ese-welcomer:config");
                if (!config || !config.data) return cancel();

                // Capitalized purple logging
                console.log(`${purplePlugin} ${formattedUser} used welcome-test! (user: ${user.username}, method: slash)`);

                instance.reply(await opendiscord.builders.messages.getSafe("ese-welcomer:success-message").build(source, { 
                    configData: config.data,
                    member: instance.member as discord.GuildMember 
                }));
                return cancel();
            }

            if (scope === "reload") {
                const config = opendiscord.configs.get("ese-welcomer:config");
                if (!config) return cancel();

                // Capitalized purple logging
                console.log(`${purplePlugin} ${formattedUser} used welcome-reload! (user: ${user.username}, method: slash)`);

                try {
                    await config.init(); 
                    instance.reply(await opendiscord.builders.messages.getSafe("ese-welcomer:reload-message").build(source, { success: true }));
                } catch (err) {
                    console.error(err);
                    instance.reply(await opendiscord.builders.messages.getSafe("ese-welcomer:reload-message").build(source, { success: false }));
                }
                return cancel();
            }
        })
    ])
})

// 8. AUTOMATIC JOIN LOGIC
opendiscord.events.get("onCodeLoad").listen(() => {
    const client = (opendiscord.client as any).client as discord.Client;
    if (!client) return;

    client.on("guildMemberAdd", async (member) => {
        const config = opendiscord.configs.get("ese-welcomer:config");
        if (!config || !config.data) return;

        const data = config.data;
        const channel = client.channels.cache.get(data.welcomeChannelId);
        if (!channel || !channel.isTextBased()) return;

        const welcomeEmbed = new discord.EmbedBuilder()
            .setTitle((data.embed.title || "Welcome!").replace("{server}", member.guild.name))
            .setDescription((data.embed.description || "")
                .replace("{user}", member.toString())
                .replace("{server}", member.guild.name)
            )
            .setColor((data.embed.color as any) || "#ff8c00");

        if (data.embed.author.name) {
            welcomeEmbed.setAuthor({
                name: data.embed.author.name.replace("{user}", member.displayName).replace("{server}", member.guild.name),
                iconURL: data.embed.author.icon.startsWith("http") ? data.embed.author.icon : undefined,
                url: data.embed.author.url.startsWith("http") ? data.embed.author.url : undefined
            });
        }

        if (data.embed.footer) welcomeEmbed.setFooter({ text: data.embed.footer.replace("{server}", member.guild.name) });
        
        const thumb = getThumbnailUrl(member, data.embed.thumbnail);
        if (thumb) welcomeEmbed.setThumbnail(thumb);

        if (data.embed.image?.startsWith("http")) welcomeEmbed.setImage(data.embed.image);
        if (data.embed.timestamp) welcomeEmbed.setTimestamp();

        try {
            await (channel as discord.TextChannel).send({
                content: (data.messageContent || "")
                    .replace("{user}", member.toString())
                    .replace("{server}", member.guild.name),
                embeds: [welcomeEmbed]
            });
        } catch (err) {
            console.error("[ERROR] Welcome message failed:", err);
        }
    });
});