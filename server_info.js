import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers
  ]
});

let isReady = false;
let guildCache = null;

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.fetch();
    guildCache = guild;
    isReady = true;
  } catch (err) {
    console.error('Guild fetch failed:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);

export default async function handler(req, res) {
  if (!isReady || !guildCache) {
    return res.status(503).json({ error: 'Guild not ready' });
  }

  try {
    const guild = guildCache;
    const members = await guild.members.fetch();
    const onlineCount = members.filter(
      m => m.presence && m.presence.status !== 'offline'
    ).size;

    const owner = await guild.fetchOwner();

    const data = {
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 256 }),
      description: guild.description ?? null,
      createdAt: guild.createdAt,
      memberCount: members.size,
      onlineCount: onlineCount,
      ownerId: owner.id,
      ownerTag: owner.user.tag,
      boostCount: guild.premiumSubscriptionCount,
      boostLevel: guild.premiumTier,
      roles: guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position
      })),
      emojis: guild.emojis.cache.map(emoji => ({
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated,
        url: emoji.url
      })),
      channels: guild.channels.cache.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type
      }))
    };

    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching server info:', err);
    res.status(500).json({ error: 'Failed to fetch server info' });
  }
}
