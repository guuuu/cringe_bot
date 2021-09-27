const fs = require("fs");
const discord = require("discord.js");
const len = require("get-mp3-duration");
const token = process.env.discord_ohno_bot;
const client = new discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
let conn = null;
const prefix = "."
let interval = null;
let songs = fs.readdirSync('./songs').map((string) => { return string.split(".mp3")[0] })

try {
    client.login(token);
    client.on("ready", () => { 
        client.user.setActivity(".help / .audios", { type: "LISTENING" });
        console.log("Bot logged in!"); 
    });

    try {
        client.on("messageCreate", (msg) => {
            let song = msg.content.split(prefix)[1];
            if(!msg.author.bot && msg.content.startsWith(prefix) && songs.includes(song)){
                if(interval !== null){ clearTimeout(interval); }
                msg.react("▶");
                let buffer = fs.readFileSync(`./songs/${songs[songs.indexOf(song)]}.mp3`);
                let sleep = len(buffer);

                const guild = client.guilds.cache.get(msg.guildId);
                const channel = guild.channels.cache.get(String(msg.member.voice.channel.id));
                
                conn = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });

                try {
                    try {
                        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause, }, })
                        const source = createAudioResource(`./songs/${songs[songs.indexOf(song)]}.mp3`);
                        try {
                            try { player.play(source); } catch (error) {}
                            try { conn.subscribe(player); } catch (error) {}
                            try { interval = setTimeout(() => {
                                if(conn !== null){ conn.destroy(); }
                                interval = null; 
                            }, sleep + 500); } catch (error) {}
                        } catch (error) {}
                    } catch (error) {}
                } catch (error) { console.log(error); }
            }
            else if(!msg.author.bot && msg.content.startsWith(prefix) && msg.content == `${prefix}audios`){
                msg.react("👍")
                let aux = "";
                songs.forEach((song, index) => {
                    aux += `${index + 1}. ${song}\n`
                })
                aux.trimEnd();
                msg.reply(aux);
            }
            else if(!msg.author.bot && msg.content.startsWith(prefix) && msg.content == `${prefix}stop`){
                msg.react("👋");
                conn.destroy();
                interval = null;
                conn = null;
            }
            else if(!msg.author.bot && msg.content.startsWith(prefix) && msg.content == `${prefix}help`){
                msg.reply(`Usa o "${prefix}audios" para saber que sons existem neste momento e basta fazer, por exemplo: "${prefix}${songs[0]}"".\nEm caso de pânico usa o ".stop".`);
            }
            else { return; }
        });
    } catch (error) {}
} catch (error) { console.log(error) }