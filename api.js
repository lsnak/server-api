// Copyright 2025 " 아바 "

import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers
  ]
});

let guildCache = null;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.fetch();
    guildCache = guild;
  } catch (err) {
    console.error('Failed to fetch guild:', err);
  }
});

app.get('/api/server-info', async (req, res) => {
  if (!guildCache) {
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
      })),
    };

    res.json(data);
  } catch (err) {
    console.error('Error fetching server info:', err);
    res.status(500).json({ error: 'Failed to fetch server info' });
  }
});

client.login(process.env.DISCORD_TOKEN);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


client.login(process.env.DISCORD_TOKEN);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// Made by " 아바 "
