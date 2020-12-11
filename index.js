/*
Yashinu tarafından paylaşılan altyapılarla benzerlik yüksektir. Onlar baz alınarak yapılmıştır.
discord.gg/serendia
Piece <3
*/

const { Discord, piece, MessageEmbed } = require('discord.js');
const piece = global.piece = new piece({ fetchAllMembers: true });
const ayar = require('./settings.json');
const fs = require('fs'); //kullanılan tek modül :(

piece.on("ready", async () => {
  piece.user.setPresence({ activity: { type: ayar.botType, name: ayar.botActivity }, status: ayar.botStatus })
  let botVoiceChannel = piece.channels.cache.get(ayar.botSesKanal);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error(err));
});

let pieceEmbed = new MessageEmbed().setColor(ayar.renk1).setFooter(ayar.footer).setTimestamp();


piece.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(ayar.botPrefix)) return;
  if (message.author.id !== ayar.botOwner && message.author.id !== message.guild.owner.id) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(ayar.botPrefix.length);
  
// Güvenliye ekleme fonksiyonu
  if(command === "güvenli") {
    let pieceTarget;
    let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
    let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (rol) pieceTarget = rol;
    if (uye) pieceTarget = uye;
    let serendiaGuvenli = ayar.pieceBeyazListe || [];
    if (!pieceTarget) return message.channel.send(pieceEmbed.setDescription(`Güvenli listeye eklemek/kaldırmak için bir pieceTarget (rol/üye) belirtmelisin!`).addField("Güvenli Liste", serendiaGuvenli.length > 0 ? serendiaGuvenli.map(g => (message.guild.roles.cache.has(g.slice(1)) || message.guild.members.cache.has(g.slice(1))) ? (message.guild.roles.cache.get(g.slice(1)) || message.guild.members.cache.get(g.slice(1))) : g).join('\n') : "Bulunamadı!"));
    if (serendiaGuvenli.some(g => g.includes(pieceTarget.id))) {
      serendiaGuvenli = serendiaGuvenli.filter(g => !g.includes(pieceTarget.id));
      ayar.pieceBeyazListe = serendiaGuvenli;
      fs.writeFile("./settings.json", JSON.stringify(ayar), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(pieceEmbed.setTitle(`Piece'den selamlar | discord.gg/serendia`).setDescription(`${pieceTarget}, ${message.author} tarafından güvenli listeden kaldırıldı!`));
    } else {
      ayar.pieceBeyazListe.push(`${pieceTarget.id}`);
      fs.writeFile("./settings.json", JSON.stringify(ayar), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(pieceEmbed.setDescription(`${pieceTarget}, ${message.author} tarafından güvenli listeye eklendi!`));
    };
  };


});
// Güvenli tanım fonksiyonu
function guvenli(kisiID) {
  let uye = piece.guilds.cache.get(ayar.guildID).members.cache.get(kisiID);
  let serendiaGuvenli = ayar.pieceBeyazListe || [];
  if (!uye || uye.id === piece.user.id || uye.id === ayar.botOwner || uye.id === uye.guild.owner.id || serendiaGuvenli.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};
//Cezaladırma fonksiyonu
const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function cezalandir(kisiID, tur) {
  let uye = piece.guilds.cache.get(ayar.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "ban") return uye.ban({ reason: "Piece Guard tarafından sunucuya zarar vermeye çalıştığı için allahına kavuşturuldu." }).catch(err => console.log(err));
};

// Kick koruması
piece.on("guildMemberRemove", async member => {
  let entry = await member.guild.fetchAuditLogs({type: 'MEMBER_KICK'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban");
  ytKapat(member.guild.id)
  let logKanali = piece.channels.cache.get(ayar.banKickLog);
  if (logKanali) logKanali.send(pieceEmbed.setTitle('Sağ Tık Kick Atıldı!').setDescription(`${member} (\`${member.id}\`) üyesi, ${entry.executor} (\`${entry.executor.id}\`) tarafından sunucudan sağ tık ile kicklendi! Kickleyen kişi sunucudan **yasaklandı**.`)).catch(err => console.log(err)); 
});
// Ban koruması
piece.on("guildBanAdd", async (guild, user) => {
  let entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id)) return;
   cezalandir(entry.executor.id, "ban");
  guild.members.unban(user.id, "Sağ Tık İle Banlandığı İçin Geri Açıldı!").catch(console.error);
  let logKanali = piece.channels.cache.get(ayar.banKickLog);
  ytKapat(user.guild.id) //bundan hic emin değilim olmazsa direk olarak guil.id deneyin.
  if (logKanali) logKanali.send(pieceEmbed.setTitle('Sağ Tık Ban Atıldı!').setDescription(`${user} (\`${user.id}\`) üyesi, ${entry.executor} (\`${entry.executor.id}\`) tarafından sunucudan sağ tık ile banlandı! Banlayan kişi sunucudan yasaklandı.`)).catch(err => console.log(err))
});
// GuildUpdate - Sunucu ayarı koruması
piece.on("guildUpdate", async (oldGuild, newGuild) => {
  let entry = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban");
  if (newGuild.name !== oldGuild.name) newGuild.setName(oldGuild.name);
  if (newGuild.iconURL({dynamic: true, size: 2048}) !== oldGuild.iconURL({dynamic: true, size: 2048})) newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}));
  let logKanali = piece.channels.cache.get(ayar.sunucuLog);
  ytKapat(newGuild.id)
  if (logKanali) logKanali.send(pieceEmbed.setTitle('Sunucu Güncellendi!').setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından sunucu güncellendi! Güncelleyen kişi banlandı ve sunucu eski haline getirildi.`)).catch(err => console.log(err))
});

// Kanal açtırmama
piece.on("channelCreate", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id)) return;
  channel.delete({reason: "Piece Guard açılan kanalı silkti."});
  cezalandir(entry.executor.id, "ban");
  ytKapat(channel.guild.id)
  let logKanali = piece.channels.cache.get(ayar.kanalLog);
  if (logKanali) logKanali.send(pieceEmbed.setTitle('Kanal Oluşturuldu!').setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından kanal oluşturuldu! Oluşturan kişi sunucudan yasaklandı ve kanal silindi.`)).catch(err => console.log(err))
});
// Kanal güncelleme koruması
piece.on("channelUpdate", async (oldChannel, newChannel) => {
  let entry = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayar.channelGuard) return;
  cezalandir(entry.executor.id, "ban");
  if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
  if (newChannel.type === "category") {
    newChannel.edit({
      name: oldChannel.name,
    });
  } else if (newChannel.type === "text") {
    newChannel.edit({
      name: oldChannel.name,
      topic: oldChannel.topic,
      nsfw: oldChannel.nsfw,
      rateLimitPerUser: oldChannel.rateLimitPerUser
    });
  } else if (newChannel.type === "voice") {
    newChannel.edit({
      name: oldChannel.name,
      bitrate: oldChannel.bitrate,
      userLimit: oldChannel.userLimit,
    });
  };
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });

  ytKapat(newChannel.guild.id)

  let logKanali = piece.channels.cache.get(ayar.kanalLog);
  if (logKanali) logKanali.send(pieceEmbed.setTitle('Kanal Güncellendi!').setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **${oldChannel.name}** kanalı güncellendi! Güncelleyen kişi sunucudan yasaklandı ve kanal eski haline getirildi.`)).catch(err => console.log(err))
});
// Kanal sililince geri açma
piece.on("channelDelete", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id)) return;
  cezalandir(entry.executor.id, "ban");
  await channel.clone({ reason: "Piece Guard silinen kanala hükmetti ve tekrar yarattı" }).then(async kanal => {
    if (channel.parentID != null) await kanal.setParent(channel.parentID);
    await kanal.setPosition(channel.position);
    if (channel.type == "category") await channel.guild.channels.cache.filter(piece => piece.parentID == channel.id).forEach(x => x.setParent(kanal.id));
  });
  ytKapat(channel.guild.id)
  let logKanali = piece.channels.cache.get(ayar.kanalLog);
  if (logKanali) logKanali.send(pieceEmbed.setTitle('Kanal Silindi!').setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **${channel.name}** kanalı silindi! Silen kişi yasaklandı ve kanal tekrar açıldı.`)).catch(err => console.log(err))
});

// Yt kapat fonksiyonu
function ytKapat(guildID) {
  let pieceGuild = piece.guilds.cache.get(guildID);
  if (!pieceGuild) return;
  pieceGuild.roles.cache.filter(pays => pays.editable && (pays.permissions.has("ADMINISTRATOR") || pays.permissions.has("MANAGE_GUILD") || pays.permissions.has("MANAGE_ROLES") || pays.permissions.has("MANAGE_WEBHOOKS"))).forEach(async pays => {
    await pays.setPermissions(0);
  });
  let logKanali = piece.channels.cache.get(ayar.ytKapat);
  if (logKanali) logKanali.send(pieceEmbed.setTitle('İzinler Kapatıldı!').setDescription(`Rollerin yetkileri kapatıldı!`)).catch(err => console.log(err))
};

piece.login(ayar.botToken).then(c => console.log(`${piece.user.tag} olarak giriş yapıldı! Bu bot için Piece'e dua etmen lazim qwe.`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu kanka bak bi tokeni falan kontrol et."));