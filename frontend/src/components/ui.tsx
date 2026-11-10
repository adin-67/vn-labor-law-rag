import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function Brand() {
  return <Link className="brand" to="/chat" aria-label="Lạc Luật — về trang hỏi đáp">
    <span className="brand-symbol" aria-hidden="true" />
    <span><span className="brand-name">lạc luật</span><span className="brand-caption" style={{display:'block'}}>HIỂU LUẬT · AN TÂM</span></span>
  </Link>;
}
export function PreviewTag() {
  return <span className="preview-tag"><span className="status-dot" />Bản xem trước</span>;
}
export function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div>
    <h1>{title.replace(/\.$/, '')}</h1><p>{subtitle}</p></div>{action}</div>;
}
export function IconButton({ icon, label, onClick, pressed, className = '' }: {
  icon: string; label: string; onClick?: () => void; pressed?: boolean; className?: string;
}) {
  return <button type="button" className={`icon-btn ${className}`} title={label} aria-label={label}
    onClick={onClick} aria-pressed={pressed}><Icon name={icon} /></button>;
}
interface FieldProps {
  name: string; label: string; value: string; onChange: (value: string) => void;
  type?: InputHTMLAttributes<HTMLInputElement>['type'] | 'textarea'; full?: boolean;
  required?: boolean; minLength?: number; placeholder?: string; autoComplete?: string;
}
export function Field({ name, label, value, onChange, type = 'text', full, required, minLength, placeholder, autoComplete }: FieldProps) {
  const id = useId();
  return <div className={`field ${full ? 'full' : ''}`}>
    <label htmlFor={id}>{label}{required && <span> *</span>}</label>
    {type === 'textarea' ? <textarea id={id} name={name} value={value} required={required} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} />
      : <input id={id} name={name} type={type} value={value} required={required} minLength={minLength}
        placeholder={placeholder} autoComplete={autoComplete}
        onInput={e => onChange(e.currentTarget.value)} onChange={e => onChange(e.target.value)} />}
  </div>;
}
export function StatusTag({ value }: { value: string }) {
  return <span className={`tag ${value.includes('Chờ') ? 'amber' : ''}`}>
    {value === 'Đã duyệt' && <Icon name="check" />}{value}
  </span>;
}
export function GoogleIcon() {
  return <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.36Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.25-2.51c-.9.6-2.04.96-3.37.96-2.61 0-4.82-1.76-5.61-4.12H3.03v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.92a6 6 0 0 1 0-3.84v-2.6H3.03a10 10 0 0 0 0 9.04l3.36-2.6Z" />
    <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.97 5.48l3.36 2.6C7.18 7.72 9.39 5.96 12 5.96Z" />
  </svg>;
}
