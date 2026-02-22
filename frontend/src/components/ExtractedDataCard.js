import React, { useState } from 'react';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="data-field">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}

function Section({ title, children, icon }) {
  const hasContent = React.Children.toArray(children).some(
    (child) => child && child.props && child.props.value
  );
  if (!hasContent) return null;
  return (
    <div className="data-section">
      <h4 className="section-title">
        <span className="section-icon">{icon}</span>
        {title}
      </h4>
      <div className="section-fields">{children}</div>
    </div>
  );
}

function ExtractedDataCard({ data }) {
  const [showRaw, setShowRaw] = useState(false);
  const d = data?.combined || data?.front || data?.back || {};

  const hasAnyData = Object.keys(d).some(
    (k) => k !== 'rawText' && k !== 'additionalInfo' && d[k]
  );

  return (
    <div className="extracted-card">
      <div className="extracted-header">
        <div className="extracted-title-group">
          <div className="extracted-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="extracted-title">Extracted Insurance Information</h3>
        </div>
        {d.rawText && (
          <button
            className="toggle-raw-btn"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? 'Hide' : 'Show'} Raw Text
          </button>
        )}
      </div>

      {!hasAnyData && !d.rawText ? (
        <div className="no-data-msg">No structured data could be extracted. Check the raw text below.</div>
      ) : (
        <div className="extracted-body">
          <Section title="Plan & Company" icon="🏥">
            <Field label="Insurance Company" value={d.insuranceCompany} />
            <Field label="Plan Name" value={d.planName} />
            <Field label="Network" value={d.network} />
            <Field label="Payer ID" value={d.payerId} />
          </Section>

          <Section title="Member Information" icon="👤">
            <Field label="Member Name" value={d.memberName} />
            <Field label="Member ID" value={d.memberId} />
            <Field label="Group Number" value={d.groupNumber} />
            <Field label="Effective Date" value={d.effectiveDate} />
          </Section>

          <Section title="Pharmacy (Rx)" icon="💊">
            <Field label="RX BIN" value={d.rxBin} />
            <Field label="RX PCN" value={d.rxPcn} />
            <Field label="RX Group" value={d.rxGroup} />
            {d.copays?.generic && <Field label="Generic Drug Copay" value={d.copays.generic} />}
            {d.copays?.brandName && <Field label="Brand Name Drug Copay" value={d.copays.brandName} />}
          </Section>

          <Section title="Copays" icon="💵">
            {d.copays?.primaryCare && <Field label="Primary Care" value={d.copays.primaryCare} />}
            {d.copays?.specialist && <Field label="Specialist" value={d.copays.specialist} />}
            {d.copays?.urgentCare && <Field label="Urgent Care" value={d.copays.urgentCare} />}
            {d.copays?.emergencyRoom && <Field label="Emergency Room" value={d.copays.emergencyRoom} />}
          </Section>

          <Section title="Coverage Details" icon="📋">
            <Field label="Deductible" value={d.deductible} />
            <Field label="Out-of-Pocket Max" value={d.outOfPocketMax} />
          </Section>

          <Section title="Contact Information" icon="📞">
            <Field label="Customer Service" value={d.customerServicePhone} />
            <Field label="Provider Services" value={d.providerPhone} />
            <Field label="Website" value={d.website} />
          </Section>

          {d.additionalInfo && d.additionalInfo.length > 0 && (
            <div className="data-section">
              <h4 className="section-title">
                <span className="section-icon">ℹ️</span>
                Additional Information
              </h4>
              <ul className="additional-info-list">
                {d.additionalInfo.map((info, i) => (
                  <li key={i} className="additional-info-item">{info}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showRaw && d.rawText && (
        <div className="raw-text-section">
          <h4 className="raw-text-title">Raw Extracted Text</h4>
          <pre className="raw-text-content">{d.rawText}</pre>
        </div>
      )}
    </div>
  );
}

export default ExtractedDataCard;
