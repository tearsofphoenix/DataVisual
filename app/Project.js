import fs from 'fs'
import moment from 'moment'
import { dialog, ipcMain } from 'electron';

const kDefaultStep = 10
const kSegments = [
  {text: '15s'},
  {text: '30s'},
  {text: '60s'},
  {text: '3min'},
  {text: '10min'},
  {text: '30min'},
  {text: '60min'},
  {text: '3h'},
  {text: '3h+'}
]

/**
 * `typeString` is like '1~15s'
 * @param {string} typeString
 * @returns {string}
 */
function parseType(typeString) {
  const array = typeString.split('-')
  return array[array.length - 1]
}

/**
 *
 * @param {string} content
 * @return {{start: moment.Moment, end: moment.Moment, type: string, count: number}}
 */
function parseContent(content) {
  const parts = content.split(': ')
  const [startString] = parts[1].split(',')
  const [endString] = parts[2].split(',')
  return {
    start: moment(startString, 'YYYY-MM-DD HH:mm'),
    end: moment(endString, 'YYYY-MM-DD HH:mm'),
    type: parseType(parts[3]),
    count: 0
  }
}

/**
 *
 * @param {string} data
 * @return {[]}
 */
function parseLines(data) {
  const lines = data.split('\n')
  const header = lines[0].split('\t')
  const parts = lines.slice(1).filter(l => l.trim().length > 0).map(l => l.split('\t'))
  const result = []
  parts.forEach(([date, contentString, count]) => {
    if (contentString && contentString.length > 0) {
      const content = parseContent(contentString)
      content.count = parseInt(count, 10)
      result.push(content)
    }
  })
  return [header, result]
}

/**
 *
 * @param {Array} parts
 * @return {moment.Moment[]}
 */
function findTimeRange(parts) {
  let finalStart = moment()
  let finalEnd = moment()
  parts.forEach((looper) => {
    const {start, end} = looper
    if (finalStart.diff(start) > 0) {
      finalStart = moment(start)
    }
    if (end.diff(finalEnd) > 0) {
      finalEnd = moment(end)
    }
  })
  return [finalStart, finalEnd]
}

/**
 *
 * @param {moment.Moment} start
 * @param {moment.Moment} end
 * @param {number} step
 * @return {Array}
 */
function generateTimeRange(start, end, step = kDefaultStep) {
  const result = []
  let timeLooper = start
  while (end.diff(timeLooper, 'minutes') > 0) {
    result.push({
      time: moment(timeLooper),
      text: timeLooper.format('MM-DD HH:mm'),
      segments: kSegments.map(l => Object.assign({count: 0}, l)),
      count: 0
    })
    timeLooper = timeLooper.add(step, 'minutes')
  }
  return result
}

function updateTimeRange(timeRange, parts, step = kDefaultStep) {
  parts.forEach(pLooper => {
    const idx = timeRange.findIndex(r => {
      const diff = pLooper.start.diff(r.time, 'minutes')
      return diff >= 0 && diff <= step
    })
    if (idx !== -1) {
      const range = timeRange[idx]
      const segIndex = range.segments.findIndex(s => s.text === pLooper.type)
      if (segIndex !== -1) {
        range.segments[segIndex].count += pLooper.count
        range.count += pLooper.count
      } else {
        console.warn('failed to find segment index for:', pLooper)
      }
    } else {
      console.warn('failed to find idx for:', pLooper)
    }
  })

  const result = []
  const timeLabels = []

  timeRange.forEach((tLooper) => {
    if (tLooper.count > 0) {
      const timeIndex = timeLabels.length
      tLooper.segments.forEach((sLooper, sIndex) => {
        result.push({ value: [timeIndex, sIndex, sLooper.count] })
      })
      timeLabels.push(tLooper.text)
    }
  })

  return [timeLabels, result]
}

/**
 * @class Project
 */
export default class Project {
  /**
   *
   * @param {string[]} files
   * @param {electron.BrowserWindow} mainWindow
   */
  constructor(files = [], mainWindow) {
    this.project = {files, title: 'Untitled'}
    /**
     * @type {electron.BrowserWindow}
     */
    this.mainWindow = mainWindow
    this.loadFiles()
    const kTimeMap = [10, 10, 30, 60, 240, 720, 1440, 10080]
    ipcMain.on('$view.chart.slider.changed', (event, arg) => {
      this.currentData.step = kTimeMap[arg]
      this.updateData()
    })

    ipcMain.on('$chart.did-get.image', (event, arg) => {
      this.saveImageData(arg)
    })

    this.mainWindow.webContents.send('$project.show.tree', this.project.files)
  }

  /**
   * @private
   */
  loadFiles = () => {
    this.project.files.forEach(filePath => {
      const data = fs.readFileSync(filePath, 'utf8')
      if (data && data.length > 0) {
        const str = data.replace(/\u{0000}/ug, '')
        const [header, result] = parseLines(str)
        const [start, end] = findTimeRange(result)
        this.currentData = {
          start,
          end,
          result,
          step: kDefaultStep
        }
        this.updateData()
      } else {
        dialog.showErrorBox('提示', '该文件不是合法的CSV文件！')
      }
    })
  }

  updateData = () => {
    const {start, end, result, step} = this.currentData
    const timeRange = generateTimeRange(moment(start), moment(end), step)
    const [timeLabels, finalData] = updateTimeRange(timeRange, result, step)

    let title
    if (end.diff(start, 'days') < 1) {
      title = `${start.year()}-${start.month() + 1}-${start.date()}数据统计`
    } else {
      title = `${start.year()}-${start.month() + 1}-${start.date()}至${end.year()}-${end.month() + 1}-${end.date()}数据统计`
    }
    this.mainWindow.webContents.send('$file.load.csv', [title, timeLabels, kSegments.map(k => k.text), finalData])
  }

  /**
   *
   * @param {string} base64Image
   */
  saveImageData = (base64Image) => {
    if (base64Image && base64Image.length > 0) {
      const filePath = dialog.showSaveDialog(this.mainWindow, {
        title: '保存图片',
        filters: [{name: 'png', extensions: ['png']}],
        message: '请选择保存路径'
      })
      if (filePath && filePath.length > 0) {
        const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');

        fs.writeFile(filePath, base64Data, 'base64', (err) => {
          if (err) {
            dialog.showErrorBox('提示', err.message)
          }
        })
      }
    }
  }
}
