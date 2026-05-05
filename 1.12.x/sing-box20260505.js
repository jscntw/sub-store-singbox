const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}
let compatible
let config = JSON.parse($files[0])

// 1. 获取订阅或组合中的原始节点
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 2. 将所有节点注入到 outbounds 总列表中
config.outbounds.push(...proxies)

// 3. 处理各个分组逻辑
config.outbounds.map(i => {
  // --- A. 落地专机组：专门存放真实的落地节点，用于被链式组引用 ---
  if (i.tag === '香港-落地专机') {
    i.outbounds.push(...getTags(proxies, /香港-落地专机/i))
  }
  if (i.tag === '日本-落地专机') {
    i.outbounds.push(...getTags(proxies, /日本-落地专机/i))
  }
  if (i.tag === '新加坡-落地专机') {
    i.outbounds.push(...getTags(proxies, /新加坡-落地专机/i))
  }
  if (i.tag === '韩国-落地专机') {
    i.outbounds.push(...getTags(proxies, /韩国-落地专机/i))
  }
  if (i.tag === '台湾-落地专机') {
    i.outbounds.push(...getTags(proxies, /台湾-落地专机/i))
  }
  if (i.tag === '美国-落地专机') {
    i.outbounds.push(...getTags(proxies, /美国-落地专机/i))
  }

  // --- B. 常规国家/地区分组：作为中继(Detour)来源或直接使用 ---
  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  if (['hk', 'hk-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /hk|hongkong|kong kong|🇭🇰/i))
  }
  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /tw|taiwan|🇹🇼/i))
  }
  if (['kr', 'kr-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /kr|KR|Korea|🇰🇷/i))
  }
  if (['jp', 'jp-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /jp|japan|🇯🇵/i))
  }
  if (['sg', 'sg-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /(sg|singapore|🇸🇬)/i))
  }
  if (['us', 'us-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /🇺🇸|US|us|unitedstates|united states|🇺🇲/i))
  }
})

// 4. 兜底处理：防止空组导致 sing-box 启动失败
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag)
  }
})

$content = JSON.stringify(config, null, 2)

// 获取节点 Tag 的工具函数（修正了之前缺失的返回逻辑）
function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}