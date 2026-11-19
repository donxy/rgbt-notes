import { FullSlug, joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// Language switcher （中 / EN). Counterpart = same page in the other
// language tree (English lives under en/). If the counterpart page does
// not exist, fall back to the other language's home page and show the
// "some pages are Chinese only" note (plan §0.2).
const LangSwitch: QuartzComponent = ({ fileData, allFiles, displayClass }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const isEn = slug === "en" || slug.startsWith("en/")
  const counterpart = (
    isEn ? (slug === "en" ? "index" : slug.slice(3)) : slug === "index" ? "en" : `en/${slug}`
  ) as FullSlug
  const known = new Set(allFiles.map((f) => f.slug))
  const hasCounterpart = known.has(counterpart)
  const target = hasCounterpart ? counterpart : isEn ? "index" : "en"
  const href = joinSegments(pathToRoot(slug), target === "index" ? "" : target)
  const note = isEn ? "Some pages are available in Chinese only" : "部分页面仅中文"
  return (
    <div class={classNames(displayClass, "lang-switch")}>
      {isEn ? (
        <>
          <a href={href} hreflang="zh">
            中文
          </a>
          <span class="lang-sep">|</span>
          <span class="lang-current">EN</span>
        </>
      ) : (
        <>
          <span class="lang-current">中文</span>
          <span class="lang-sep">|</span>
          <a href={href} hreflang="en">
            EN
          </a>
        </>
      )}
      {!hasCounterpart && <span class="lang-note">{note}</span>}
    </div>
  )
}

LangSwitch.css = `
.lang-switch {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  margin: 0.4rem 0;
}
.lang-switch a {
  color: var(--secondary);
}
.lang-switch .lang-current {
  font-weight: 600;
  color: var(--darkgray);
}
.lang-switch .lang-sep {
  color: var(--gray);
}
.lang-switch .lang-note {
  color: var(--gray);
  font-size: 0.75rem;
  margin-left: 0.4rem;
}
`

export default (() => LangSwitch) satisfies QuartzComponentConstructor
