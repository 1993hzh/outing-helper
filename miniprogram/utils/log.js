var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

module.exports = {
  debug() {
    if (!log) return
    console.debug(arguments);
    log.debug.apply(log, arguments)
  },
  info() {
    if (!log) return
    console.info(arguments);
    log.info.apply(log, arguments)
  },
  warn() {
    if (!log) return
    console.warn(arguments);
    log.warn.apply(log, arguments)
  },
  error() {
    if (!log) return
    console.error(arguments);
    log.error.apply(log, arguments)
  },
  setFilterMsg(msg) { // 从基础库2.7.3开始支持
    if (!log || !log.setFilterMsg) return
    if (typeof msg !== 'string') return
    log.setFilterMsg(msg)
  },
  addFilterMsg(msg) { // 从基础库2.8.1开始支持
    if (!log || !log.addFilterMsg) return
    if (typeof msg !== 'string') return
    log.addFilterMsg(msg)
  }
}