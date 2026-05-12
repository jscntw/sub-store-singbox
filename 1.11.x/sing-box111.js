const { type, name } = $arguments;
let config = JSON.parse($files[0]);
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
});

config.outbounds.push(...proxies);

const regionMap = {
  'us': /🇺🇸|us|united\s?states|🇺🇲/i,
  'jp': /jp|japan|🇯🇵/i,
  'sg': /sg|singapore|🇸🇬/i,
  'kr': /kr|korea|🇰🇷/i,
  'tw': /tw|taiwan|🇹🇼/i,
  'hk': /hk|hong\s?kong|🇭🇰/i
};

config.outbounds.map(i => {
  if (!i.outbounds || !Array.isArray(i.outbounds)) return;

  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies));
  }

  for (const [key, regex] of Object.entries(regionMap)) {
    if (i.tag === key || i.tag === `${key}-auto`) {
      i.outbounds.push(...getTags(proxies, regex));
    }
  }
});

config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    outbound.outbounds.push("direct");
  }
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag);
}
