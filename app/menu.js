// @flow
import { app, Menu, ipcMain, dialog, shell, BrowserWindow } from 'electron';
import fs from 'fs'
import moment from 'moment';

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

function parseLines(data) {
  const lines = data.split('\n')
  const header = lines[0].split('\t')
  const parts = lines.slice(1).filter(l => l.trim().length > 0).map(l => l.split('\t'))
  const result = []
  parts.forEach(([date, contentString, count, percent]) => {
    if (contentString && contentString.length > 0) {
      const content = parseContent(contentString)
      content.count = parseInt(count, 10)
      result.push(content)
    }
  })
  return [header, result]
}

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

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    const kTimeMap = [10, 10, 30, 60, 240, 720, 1440, 10080]
    ipcMain.on('$view.chart.slider.changed', (event, arg) => {
      this.currentData.step = kTimeMap[arg]
      this.updateData()
    })
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  loadCSVFile = (filePath) => {
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

  tryOpenFileHandler = () => {
      const filePath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{name: 'CSV', extensions: ['csv']}],
        message: '请选择CSV数据文件'
      })
      if (filePath && filePath.length > 0) {
        this.loadCSVFile(filePath[0])
      }
  }

  buildDarwinTemplate = () => {
    const subMenuFile = {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          click: this.tryOpenFileHandler
        }
      ]
    }
    const subMenuAbout = {
      label: 'Electron',
      submenu: [
        {
          label: 'About DataAnalysis',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide DataAnalysis',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        }
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuFile, subMenuView];
  }

  buildDefaultTemplate = () => {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
            click: this.tryOpenFileHandler
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  }
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.toggleDevTools();
                  }
                }
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click() {
              shell.openExternal('http://electron.atom.io');
            }
          },
          {
            label: 'Documentation',
            click() {
              shell.openExternal(
                'https://github.com/atom/electron/tree/master/docs#readme'
              );
            }
          },
          {
            label: 'Community Discussions',
            click() {
              shell.openExternal('https://discuss.atom.io/c/electron');
            }
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal('https://github.com/atom/electron/issues');
            }
          }
        ]
      }
    ];

    return templateDefault;
  }
}
