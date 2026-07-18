import React, { useEffect, useState } from 'react'
import { fetchAllSettings, upsertSettings } from '../../api/settings'
import type { Setting } from '../../types'

/** 設定欄位定義 */
const SETTING_FIELDS: { key: string; label: string; type?: string }[] = [
  { key: 'company_name', label: '公司名稱' },
  { key: 'company_phone', label: '公司電話' },
  { key: 'company_address', label: '公司地址' },
  { key: 'company_email', label: '公司 Email', type: 'email' },
  { key: 'company_description', label: '公司簡介', type: 'textarea' },
]

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await fetchAllSettings()
      const map: Record<string, string> = {}
      for (const s of data) {
        map[s.key] = s.value
      }
      setSettings(map)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const entries = SETTING_FIELDS.map((f) => ({
        key: f.key,
        value: settings[f.key] ?? '',
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

      <div className="settings-form">
        {SETTING_FIELDS.map((field) => (
          <div className="form-group" key={field.key}>
            <label htmlFor={`setting-${field.key}`}>
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={`setting-${field.key}`}
                rows={4}
                value={settings[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            ) : (
              <input
                id={`setting-${field.key}`}
                type={field.type ?? 'text'}
                value={settings[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SettingsPage
