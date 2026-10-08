interface Props {
  title: string
  legacyPath: string
  linkText: string
}

export function LegacyRedirectNotice({ title, legacyPath, linkText }: Props) {
  return (
    <div style={{ maxWidth: 480, margin: '4rem auto' }}>
      <h1 className="h4 mb-3">{title}</h1>
      <p>
        This isn't available in the new app yet. <a href={legacyPath}>{linkText}</a>.
      </p>
    </div>
  )
}
