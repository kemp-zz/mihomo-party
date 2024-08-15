import { Button, Input, Switch, Tab, Tabs } from '@nextui-org/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import {
  checkAutoRun,
  enableAutoRun,
  disableAutoRun,
  quitApp,
  checkUpdate,
  patchControledMihomoConfig
} from '@renderer/utils/ipc'
import { IoLogoGithub } from 'react-icons/io5'
import { platform, version } from '@renderer/utils/init'
import useSWR from 'swr'
import { Key, useState } from 'react'
import debounce from '@renderer/utils/debounce'
import { useTheme } from 'next-themes'

const Settings: React.FC = () => {
  const { setTheme } = useTheme()
  const { data: enable, mutate } = useSWR('checkAutoRun', checkAutoRun, {
    errorRetryCount: 5,
    errorRetryInterval: 200
  })
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    silentStart = false,
    controlDns = true,
    controlSniff = true,
    useDockIcon = true,
    delayTestUrl,
    delayTestTimeout,
    autoCheckUpdate,
    userAgent,
    autoCloseConnection = true,
    appTheme = 'system'
  } = appConfig || {}
  const [url, setUrl] = useState(delayTestUrl)
  const setUrlDebounce = debounce((v: string) => {
    patchAppConfig({ delayTestUrl: v })
  }, 500)
  const [ua, setUa] = useState(userAgent)
  const setUaDebounce = debounce((v: string) => {
    patchAppConfig({ userAgent: v })
  }, 500)

  const onThemeChange = (key: Key, type: 'theme' | 'color'): void => {
    const [theme, color] = appTheme.split('-')

    if (type === 'theme') {
      let themeStr = key.toString()
      if (key !== 'system') {
        if (color) {
          themeStr += `-${color}`
        }
      }
      setTheme(themeStr)
      patchAppConfig({ appTheme: themeStr as AppTheme })
    } else {
      let themeStr = theme
      if (theme !== 'system') {
        if (key !== 'blue') {
          themeStr += `-${key}`
        }
        setTheme(themeStr)
        patchAppConfig({ appTheme: themeStr as AppTheme })
      }
    }
  }

  return (
    <BasePage
      title="应用设置"
      header={
        <Button
          isIconOnly
          size="sm"
          onPress={() => {
            window.open('https://github.com/pompurin404/mihomo-party')
          }}
        >
          <IoLogoGithub className="text-lg" />
        </Button>
      }
    >
      <SettingCard>
        <SettingItem title="开机自启" divider>
          <Switch
            size="sm"
            isSelected={enable}
            onValueChange={async (v) => {
              try {
                if (v) {
                  await enableAutoRun()
                } else {
                  await disableAutoRun()
                }
              } catch (e) {
                alert(e)
              } finally {
                mutate()
              }
            }}
          />
        </SettingItem>
        <SettingItem title="自动检查更新" divider>
          <Switch
            size="sm"
            isSelected={autoCheckUpdate}
            onValueChange={(v) => {
              patchAppConfig({ autoCheckUpdate: v })
            }}
          />
        </SettingItem>
        <SettingItem title="静默启动" divider>
          <Switch
            size="sm"
            isSelected={silentStart}
            onValueChange={(v) => {
              patchAppConfig({ silentStart: v })
            }}
          />
        </SettingItem>
        {platform === 'darwin' && (
          <SettingItem title="显示Dock图标" divider>
            <Switch
              size="sm"
              isSelected={useDockIcon}
              onValueChange={(v) => {
                patchAppConfig({ useDockIcon: v })
              }}
            />
          </SettingItem>
        )}

        <SettingItem title="背景色" divider={appTheme !== 'system'}>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={appTheme.split('-')[0]}
            onSelectionChange={(key) => {
              onThemeChange(key, 'theme')
            }}
          >
            <Tab key="system" title="自动" />
            <Tab key="dark" title="深色" />
            <Tab key="gray" title="灰色" />
            <Tab key="light" title="浅色" />
          </Tabs>
        </SettingItem>
        {appTheme !== 'system' && (
          <SettingItem title="主题色">
            <Tabs
              size="sm"
              color="primary"
              selectedKey={appTheme.split('-')[1] || 'blue'}
              onSelectionChange={(key) => {
                onThemeChange(key, 'color')
              }}
            >
              <Tab key="blue" title="蓝色" />
              <Tab key="pink" title="粉色" />
              <Tab key="green" title="绿色" />
            </Tabs>
          </SettingItem>
        )}
      </SettingCard>
      <SettingCard>
        <SettingItem title="订阅拉取 UA" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={ua}
            placeholder="默认 clash-meta"
            onValueChange={(v) => {
              setUa(v)
              setUaDebounce(v)
            }}
          ></Input>
        </SettingItem>
        <SettingItem title="延迟测试地址" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={url}
            placeholder="默认http://cp.cloudflare.com/generate_204"
            onValueChange={(v) => {
              setUrl(v)
              setUrlDebounce(v)
            }}
          ></Input>
        </SettingItem>
        <SettingItem title="延迟测试超时时间" divider>
          <Input
            type="number"
            size="sm"
            className="w-[60%]"
            value={delayTestTimeout?.toString()}
            placeholder="默认5000"
            onValueChange={(v) => {
              patchAppConfig({ delayTestTimeout: parseInt(v) })
            }}
          />
        </SettingItem>
        <SettingItem title="接管DNS设置" divider>
          <Switch
            size="sm"
            isSelected={controlDns}
            onValueChange={async (v) => {
              await patchAppConfig({ controlDns: v })
              await patchControledMihomoConfig({})
            }}
          />
        </SettingItem>
        <SettingItem title="接管域名嗅探设置" divider>
          <Switch
            size="sm"
            isSelected={controlSniff}
            onValueChange={async (v) => {
              await patchAppConfig({ controlSniff: v })
              await patchControledMihomoConfig({})
            }}
          />
        </SettingItem>
        <SettingItem title="自动断开连接">
          <Switch
            size="sm"
            isSelected={autoCloseConnection}
            onValueChange={(v) => {
              patchAppConfig({ autoCloseConnection: v })
            }}
          />
        </SettingItem>
      </SettingCard>
      <SettingCard>
        <SettingItem title="检查更新" divider>
          <Button
            size="sm"
            onPress={async () => {
              try {
                const version = await checkUpdate()

                if (version) {
                  new window.Notification(`v${version}版本已发布`, {
                    body: '点击前往下载'
                  }).onclick = (): void => {
                    open(`https://github.com/pompurin404/mihomo-party/releases/tag/v${version}`)
                  }
                } else {
                  new window.Notification('当前已是最新版本', { body: '无需更新' })
                }
              } catch (e) {
                alert(e)
              }
            }}
          >
            检查更新
          </Button>
        </SettingItem>
        <SettingItem title="退出应用" divider>
          <Button size="sm" onPress={quitApp}>
            退出应用
          </Button>
        </SettingItem>
        <SettingItem title="应用版本">
          <div>v{version}</div>
        </SettingItem>
      </SettingCard>
    </BasePage>
  )
}

export default Settings
