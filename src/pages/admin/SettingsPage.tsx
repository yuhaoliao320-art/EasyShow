import React, { useEffect, useState, useCallback } from 'react'
import { fetchAllSettings, upsertSettings } from '../../api/settings'
import type { Setting } from '../../types'

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllSettings()
      setSettings(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  /** 根據 value_type 對應到 HTML input type */
  const getInputType = (valueType: Setting['value_type']): string => {
    switch (valueType) {
      case 'number':
        return 'number'
      case 'email':
        return 'email'
      case 'tel':
        return 'tel'
      case 'url':
        return 'url'
      default:
        return 'text'
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    )
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const entries = settings.map((s) => ({
        key: s.key,
        value: s.value,
      }))
      await upsertSettings(entries)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">載入中...</div>
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>網站設定</h1>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && (
        <div className="success-message">設定已成功儲存！</div>
      )}

      {settings.length === 0 && !loading && (
        <div className="empty-state">
          <p>尚無任何設定，請先在資料庫中新增設定項目。</p>
        </div>
      )}

      <div className="settings-form">
        {settings.map((setting) => (
          <div className="form-group" key={setting.key}>
            <label htmlFor={`setting-${setting.key}`}>
              {setting.description || setting.key}
            </label>
            {setting.value_type === 'textarea' ? (
              <textarea
                id={`setting-${setting.key}`}
                rows={4}
                value={setting.value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
              />
            ) : setting.value_type === 'boolean' ? (
              <div className="setting-boolean">
                <label className="toggle">
                  <input
                    type="checkbox"
                    id={`setting-${setting.key}`}
                    checked={setting.value === 'true'}
                    onChange={(e) =>
                      handleChange(setting.key, e.target.checked ? 'true' : 'false')
                    }
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="setting-boolean-label">
                  {setting.value === 'true' ? '開啟' : '關閉'}
                </span>
              </div>
            ) : (
              <input
                id={`setting-${setting.key}`}
                type={getInputType(setting.value_type)}
                value={setting.value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                min={setting.value_type === 'number' ? 0 : undefined}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SettingsPage
