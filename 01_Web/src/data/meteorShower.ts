/**
 * 流星雨触发信号：按钮写入请求，星空更新循环每帧消费。
 * 模块级单例，跨组件（MeteorShowerButton ↔ CesiumConstellationSky）零耦合。
 */
let pendingShower = false

/** 由流星雨按钮调用 */
export const requestMeteorShower = () => {
  pendingShower = true
}

/** 由星空更新循环调用：消费一次请求，返回是否需要开启流星雨窗口 */
export const consumeMeteorShower = () => {
  if (!pendingShower) return false
  pendingShower = false
  return true
}
