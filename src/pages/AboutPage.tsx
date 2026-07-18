import React from 'react'
import { useOutletContext } from 'react-router-dom'

const AboutPage: React.FC = () => {
  const { company } = useOutletContext<{ company: Record<string, string> }>()

  const hasAny =
    company.company_description ||
    company.company_phone ||
    company.company_email ||
    company.company_address

  if (!hasAny) {
    return (
      <div className="about-page">
        <div className="empty-state">
          <p>尚無公司資訊，請前往後臺設定。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="about-page">
      {/* 公司簡介 */}
      {company.company_description && (
        <section className="about-section about-intro">
          <h1 className="about-title">
            {company.company_name || '關於我們'}
          </h1>
          <div className="about-description">
            {company.company_description.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
        </section>
      )}

      {/* 聯絡資訊 */}
      {(company.company_phone || company.company_email || company.company_address) && (
        <section className="about-section about-contact">
          <h2 className="about-section-title">聯絡資訊</h2>
          <div className="about-contact-list">
            {company.company_phone && (
              <div className="about-contact-item">
                <span className="about-contact-icon">📞</span>
                <div className="about-contact-body">
                  <span className="about-contact-label">電話</span>
                  <a href={`tel:${company.company_phone}`} className="about-contact-value">
                    {company.company_phone}
                  </a>
                </div>
              </div>
            )}
            {company.company_email && (
              <div className="about-contact-item">
                <span className="about-contact-icon">✉️</span>
                <div className="about-contact-body">
                  <span className="about-contact-label">Email</span>
                  <a href={`mailto:${company.company_email}`} className="about-contact-value">
                    {company.company_email}
                  </a>
                </div>
              </div>
            )}
            {company.company_address && (
              <div className="about-contact-item">
                <span className="about-contact-icon">📍</span>
                <div className="about-contact-body">
                  <span className="about-contact-label">地址</span>
                  <span className="about-contact-value">{company.company_address}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AboutPage
