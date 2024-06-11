import Browser from 'webextension-polyfill'
import {
  deleteConversation,
  sendMessageFeedback,
} from '../services/apis/chatgpt-web'
import { generateAnswersWithCustomApi } from '../services/apis/custom-api.mjs'
import {
  customApiModelKeys,
  defaultConfig,
  getUserConfig,
  setUserConfig,
} from '../config/index.mjs'
import '../_locales/i18n'
import { openUrl } from '../utils/open-url'
import { registerPortListener } from '../services/wrappers.mjs'
import { refreshMenu } from './menus.mjs'
import { registerCommands } from './commands.mjs'
async function executeApi(session, port, config) {
  console.debug('modelName', session.modelName)
  if (customApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithCustomApi(
      port,
      session.question,
      session,
      config.customApiKey,
      config.customModelName,
    )
  } else {
    throw new Error(`Unsupported model: ${session.modelName}`)
  }
}
Browser.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.type) {
    case 'FEEDBACK': {
      const token = await getChatGptAccessToken()
      await sendMessageFeedback(token, message.data)
      break
    }
    case 'DELETE_CONVERSATION': {
      const token = await getChatGptAccessToken()
      await deleteConversation(token, message.data.conversationId)
      break
    }
    case 'NEW_URL': {
      const newTab = await Browser.tabs.create({
        url: message.data.url,
        pinned: message.data.pinned,
      })
      if (message.data.saveAsChatgptConfig) {
        await setUserConfig({
          chatgptTabId: newTab.id,
          chatgptJumpBackTabId: sender.tab.id,
        })
      }
      break
    }
    case 'OPEN_URL':
      openUrl(message.data.url)
      break
    case 'OPEN_CHAT_WINDOW': {
      const config = await getUserConfig()
      const url = Browser.runtime.getURL('IndependentPanel.html')
      const tabs = await Browser.tabs.query({ url: url, windowType: 'popup' })
      if (!config.alwaysCreateNewConversationWindow && tabs.length > 0)
        await Browser.windows.update(tabs[0].windowId, { focused: true })
      else
        await Browser.windows.create({
          url: url,
          type: 'popup',
          width: 500,
          height: 650,
        })
      break
    }
    case 'REFRESH_MENU':
      refreshMenu()
      break
  }
})
registerPortListener(async (session, port, config) => await executeApi(session, port, config))
registerCommands()
refreshMenu()
